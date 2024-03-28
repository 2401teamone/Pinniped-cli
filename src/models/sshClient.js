import { Client } from "ssh2";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
const BASE_DIR = "/home/ubuntu/server";

export default class SSHClient {
  constructor(connectionParams, spinner) {
    this.connectionParams = connectionParams;
    this.spinner = spinner;
    this.sshClient = new Client();
  }

  async connect() {
    const { hostName, username, privateKeyPath } = this.connectionParams;

    try {
      await new Promise((resolve, reject) => {
        this.sshClient.on("error", reject);
        this.sshClient.on("ready", resolve);
        this.sshClient.connect({
          host: hostName,
          username: username,
          privateKey: readFileSync(privateKeyPath),
          port: 22,
        });
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async sftpConnect() {
    return new Promise((resolve, reject) => {
      this.sshClient.sftp((err, sftp) => {
        if (err) {
          sftp.end();
          return reject(err);
        }
        this.sftp = sftp;
        resolve();
      });
    });
  }

  async runCommand(commandKey) {
    await this.connect();
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

  async syncFiles(localDirPath, remoteDirPath, filterKey) {
    // create the destination directory on the EC2 instance if it doesn't exist
    await this.connect();
    await this.sftpConnect();

    const filterFunc = SSHClient.syncFilters[filterKey];

    const items = readdirSync(localDirPath).filter(
      SSHClient.syncFilters[filterKey]
    );

    await this.createDir(remoteDirPath);
    this.spinner.text = `created directory ${remoteDirPath.split("/").pop()}`;

    this.spinner.text = "Copying project files to EC2 instance";
    for (const item of items) {
      const localItemPath = path.join(localDirPath, item);
      const remoteItemPath = path.join(remoteDirPath, item);

      await this.uploadRecursive(localItemPath, remoteItemPath, filterFunc);
    }

    this.closeSftpConnection();
  }

  // Recursive function to upload files/directories
  async uploadRecursive(localPath, remotePath, filterFunc) {
    // Check if the item is a file or directory
    const stats = statSync(localPath);

    if (stats.isDirectory()) {
      // If it's a directory, create the directory on the remote server
      await this.createDir(remotePath);

      // Read the directory and upload its contents recursively
      const subItems = readdirSync(localPath).filter(filterFunc);
      for (const subItem of subItems) {
        const subLocalPath = path.join(localPath, subItem);
        const newRemotePath = path.join(remotePath, subItem);

        await this.uploadRecursive(subLocalPath, newRemotePath, filterFunc);
      }
    } else {
      // If it's a file, upload it to the remote server
      await this.sendFile(localPath, remotePath);
    }
  }

  // Send a file to the EC2 instance
  async sendFile(localPath, remotePath) {
    if (this.sftp === undefined) {
      await this.sftpConnect();
    }
    return await new Promise((resolve, reject) => {
      this.sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  async createDir(remotePath) {
    return await new Promise((resolve, reject) => {
      // Check if the directory already exists
      this.sftp.readdir(remotePath, (err) => {
        if (!err) {
          // Directory already exists, resolve immediately
          this.spinner.text = `directory ${remotePath
            .split("/")
            .pop()} already exists`;
          return resolve();
        }

        // If readdir throws an error, it means the directory doesn't exist
        // Attempt to create the directory
        this.sftp.mkdir(remotePath, (err) => {
          if (err) {
            return reject(err);
          }
          this.spinner.text = `created directory ${remotePath
            .split("/")
            .pop()}`;
          resolve();
        });
      });
    });
  }

  closeConnection() {
    this.sshClient.end();
  }

  closeSftpConnection() {
    this.sftp.end();
  }

  static syncFilters = {
    // Sync all project files, except node_modules, package-lock.json, and instanceData.json
    deploy(fileName) {
      return (
        !["node_modules", "package-lock.json", "instanceData.json"].includes(
          fileName
        ) && !fileName.endsWith(".pem")
      );
    },

    // Sync all files that deploy does, but also exclude pnpd_data directory and files inside it
    updateApp(fileName) {
      return (
        ![
          "node_modules",
          "package-lock.json",
          "instanceData.json",
          "pnpd_data",
        ].includes(fileName) && !fileName.endsWith(".pem")
      );
    },
  };

  static commands = {
    installNode:
      "DEBIAN_FRONTEND=noninteractive curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs",
    test: "touch test.txt",
    installDependencies: "cd server/ && npm install",
    installPM2: "sudo npm install pm2 -g",
    start: "cd server/ && sudo pm2 start index.js",
    stop: "sudo pm2 stop 0",
    status: "sudo pm2 list",
  };
}
