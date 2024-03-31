import { Client } from "ssh2";
import sftpClient from "ssh2-sftp-client";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

export default class SSHClient {
  static syncFilters = {
    // Sync all project files, except node_modules, package-lock.json, and instanceData.json
    full(fileName) {
      return (
        !["node_modules", "package-lock.json", "instanceData.json"].includes(
          fileName
        ) && !fileName.endsWith(".pem")
      );
    },
    // Don't exclude any files in the dist directory
    frontend(fileName) {
      return true;
    },
    // Don't exclude any files in the migrations directory
    schema(fileName) {
      return true;
    },

    // Exclude all files that "full" excludes, plus pnpd_data and dist
    backend(fileName) {
      return (
        ![
          "node_modules",
          "package-lock.json",
          "instanceData.json",
          "pnpd_data",
          "dist",
        ].includes(fileName) && !fileName.endsWith(".pem")
      );
    },
  };

  static commands = {
    installNode:
      "DEBIAN_FRONTEND=noninteractive curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs",
    installPM2: "sudo npm install pm2 -g",
    update: "sudo apt-get update",
    installLibcap2Bin: "sudo apt-get install libcap2-bin",
    setcap: "sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node",
    installDependencies: "cd server/ && npm install",
    updateDependencies: "cd server/ && npm update",
    start: "cd server/ && pm2 start index.js",
    restart: "pm2 restart 0",
    stop: "pm2 stop 0",
  };
  /**
   * Constructor for the SSHClient class
   * @param {Object} EC2MetaData - An object containing metadata for the EC2 instance
   * @param {Object} spinner - An ora spinner object
   */
  constructor(EC2MetaData, spinner) {
    this.EC2MetaData = EC2MetaData;
    this.spinner = spinner;
    this.sshClient = new Client();
  }

  /**
   * Method to connect to the EC2 instance using ssh2
   * @param {number} retryLimit - The number of times to retry connecting
   * @param {number} attemptNum - The current attempt number
   * @returns {Promise<void>} - Resolves when the connection is established
   * @throws {Error} - If the connection fails
   */
  async connect(retryLimit = 0, attemptNum = 1) {
    try {
      await new Promise((resolve, reject) => {
        this.sshClient.on("error", reject);
        this.sshClient.on("ready", resolve);
        this.sshClient.connect({
          host: this.EC2MetaData.publicIpAddress,
          username: this.EC2MetaData.username,
          privateKey: readFileSync(this.EC2MetaData.privateKeyPath),
          port: 22,
        });
      });
    } catch (error) {
      if (attemptNum < retryLimit) {
        this.spinner.text = `Connection failed. Retrying in 5 seconds... Attempt ${attemptNum}`;

        // Wait 5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.connect(retryLimit, attemptNum + 1);
      } else {
        throw new Error(`Failed to connect to EC2 instance: ${error.message}`);
      }
    }
  }

  /**
   * Method to connect to the EC2 instance using ssh2-sftp-client
   * Sets the sftp property on the SSHClient instance for use in other methods
   * @returns {Promise<void>} - Resolves when the connection is established
   */
  async sftpConnect() {
    this.sftp = new sftpClient();

    this.spinner.text = "Initializing SFPT connection to EC2 instance";
    await this.sftp.connect({
      host: this.EC2MetaData.publicIpAddress,
      username: this.EC2MetaData.username,
      privateKey: readFileSync(this.EC2MetaData.privateKeyPath),
      port: 22,
    });
    this.spinner.text = "SFTP connection established";
  }

  /**
   * Method to run a command on the EC2 instance
   * Connects to the instance using ssh2 if not already connected, runs the command
   * and closes the connection
   * @param {string} commandKey - The key of the command to run
   * @returns {Promise<void>} - Resolves when the command is executed
   * @throws {Error} - If the command fails
   */
  async runCommand(commandKey) {
    const command = SSHClient.commands[commandKey];

    this.spinner.text = `Running ${commandKey} command on the EC2 instance`;

    const { stdout, stderr } = await new Promise((resolve, reject) => {
      this.sshClient.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = "";
        let stderr = "";
        stream
          .on("data", (data) => (stdout += data.toString()))
          .on("error", (err) => reject(err))
          .on("close", (code) => {
            if (code !== 0) {
              reject(new Error(`Command failed with code ${code}`));
            } else {
              resolve({ stdout, stderr });
            }
          });
      });
    });

    this.spinner.text = stdout;

    this.spinner.text = "Command executed successfully";
  }

  /**
   * Method to sync files from the local project directory to the EC2 instance
   * @param {string} localDirPath - The local path of the project directory
   * @param {string} remoteDirPath - The remote path of the project directory on the EC2 instance
   * @param {string} filterKey - The key of the filter function to use
   * @returns {Promise<void>} - Resolves when the files are synced
   */
  async syncFiles(localDirPath, remoteDirPath, filterKey) {
    if (this.sftp === undefined) await this.sftpConnect();
    this.spinner.text = "Updating project files on EC2 instance";

    const filterFunc = SSHClient.syncFilters[filterKey];

    const localItems = readdirSync(localDirPath).filter(filterFunc);

    if (!(await this.exists(remoteDirPath))) {
      await this.createDir(remoteDirPath);
    }

    // If doing a full sync, delete the remote contents and create a new one
    if (filterKey === "full") {
      await this.deleteDirContents(remoteDirPath);
    } else {
      await this.createDir(remoteDirPath);
    }

    for (const item of localItems) {
      const localItemPath = path.join(localDirPath, item);
      const remoteItemPath = path.join(remoteDirPath, item);

      await this.uploadRecursive(localItemPath, remoteItemPath, filterFunc);
    }

    this.closeSftpConnection();
  }

  /**
   * Method to upload files and directories recursively to the EC2 instance
   * @param {string} localPath - The local path of the file or directory to upload
   * @param {string} remotePath - The remote path to upload the file or directory to
   * @param {Function} filterFunc - A function to filter which files to upload
   * @returns {Promise<void>} - Resolves when the file or directory is uploaded
   */
  async uploadRecursive(localPath, remotePath, filterFunc) {
    // Check if the item is a file or directory
    const stats = statSync(localPath);

    if (stats.isDirectory()) {
      // If it's a directory, create the directory on the remote server
      this.spinner.text = `Syncing directory ${this.getFileName(
        localPath
      )} with EC2 instance`;

      if (await this.exists(remotePath)) {
        await this.deleteDirContents(remotePath);
      }

      await this.createDir(remotePath);

      // Read the directory and upload its contents recursively
      const subItems = readdirSync(localPath).filter(filterFunc);
      for (const subItem of subItems) {
        const newLocalPath = path.join(localPath, subItem);
        const newRemotePath = path.join(remotePath, subItem);

        await this.uploadRecursive(newLocalPath, newRemotePath, filterFunc);
      }
    } else {
      // If it's a file, upload it to the remote server
      await this.sendFile(localPath, remotePath);
    }
  }

  /**
   * Method to upload a file to the EC2 instance
   * @param {string} localPath - The local path of the file to upload
   * @param {string} remotePath - The remote path to upload the file to
   * @returns {Promise<void>} - Resolves when the file is uploaded
   */
  async sendFile(localPath, remotePath) {
    if (this.sftp === undefined) {
      await this.sftpConnect();
    }
    await this.sftp.fastPut(localPath, remotePath);
  }

  /**
   * Method to check if a file or directory exists on the EC2 instance
   * @param {string} remotePath - The remote path to check
   * @returns {Promise<boolean>} - True if the file or directory exists, false otherwise
   * @throws {Error} - If an error occurs checking if the file or directory exists
   */
  async exists(remotePath) {
    return await this.sftp.exists(remotePath);
  }

  /**
   * Method to create a directory on the EC2 instance
   * @param {string} remotePath - The remote path of the directory to create
   * @returns {Promise<void>} - Resolves when the directory is created
   * @throws {Error} - If an error occurs creating the directory
   */
  async createDir(remotePath) {
    return await this.sftp.mkdir(remotePath, true);
  }

  /**
   * Method to delete the contents of a directory on the EC2 instance
   * @param {string} remotePath - The remote path of the directory to delete
   * @returns {Promise<void>} - Resolves when the directory contents are deleted
   * @throws {Error} - If an error occurs deleting the directory contents
   */
  async deleteDirContents(remotePath) {
    const list = await this.sftp.list(remotePath);
    for (const item of list) {
      if (item.type === "-") {
        await this.sftp.delete(`${remotePath}/${item.name}`);
      } else if (item.type === "d" && item.name !== "node_modules") {
        await this.deleteDirContents(`${remotePath}/${item.name}`);
        await this.sftp.rmdir(`${remotePath}/${item.name}`);
      }
    }
  }

  /**
   * Method to get the file name from a file path
   * @param {string} filePath - The file path
   * @returns {string} - The file name
   */
  getFileName(filePath) {
    return filePath.split("/").pop();
  }

  /**
   * Method to close the ssh2 connection to the EC2 instance
   * @returns {undefined} - No return value
   */
  closeConnection() {
    this.sshClient.end();
  }

  /**
   * Method to close the sftp connection to the EC2 instance
   * @returns {undefined} - No return value
   */
  closeSftpConnection() {
    this.sftp.end();
  }
}
