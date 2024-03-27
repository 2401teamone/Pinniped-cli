import fs from "fs";
import path from "path";
import { Client } from "ssh2";
const DESTINATION_BASE_PATH = "/home/ubuntu/server";

/**
 * Goal : Recursively iterate through the current working directory and
 *        create files / directories on the ec2 instance to mimic the current
 *        working directory structure.
 *
 * Rules : Do not send over any files that end with .pem, or that are contained
 *         within the node_modules directory, or package-lock.json
 *
 * upladFilesToEc2
 * - Accepts connectionParams Object { hostName, username, privateKeyPath }
 * - returns a  promise that resolves to undefined, or throws an error
 *
 * 1. Make a connection to the ec2 instance via SSH
 *
 * 2. Create a "server" directory on the ec2 instance
 *    - createDir Helper function
 *
 * recursiveUpload
 * - accepts a path to a directory
 *
 * 1. get a list of all the files in the directory
 * 2. filter out any files / directories that should not be sent
 * 3. iterate over the filtered list of entities
 *    - If the entity is a file,
 *        - send the file to ec2 at the correct path
 *    - If the entity is a directory,
 *        - pass the path to the directory + prev path as an argument to the
 *          recursiveUpload method
 *
 *
 */

// Main function to upload files/directories to EC2
export default async function uploadFilesToEC2(connectionParams) {
  // Create SSH connection
  let sshClient = new Client();

  await sshConnect(sshClient, connectionParams);

  const sftp = await getSftpConnection(sshClient);

  console.log("Connected to EC2 instance.");

  // Create "server" directory on the EC2 instance
  await createDir(sshClient, DESTINATION_BASE_PATH);
  console.log("Created server directory on EC2 instance.");

  // Upload each file/directory
  const localDir = process.cwd();
  const items = fs.readdirSync(localDir).filter(filterFunc);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = path.join(DESTINATION_BASE_PATH, item);

    await uploadRecursive(localPath, remotePath, item, sshClient);
  }
  sshClient.end();
}

// Recursive function to upload files/directories
const uploadRecursive = async (localPath, remotePath, item, sshClient) => {
  console.log(`Processing ${localPath.split("/").pop()}`);
  // Check if the item is a file or directory
  const stats = fs.statSync(localPath);

  console.log(
    `File type of ${localPath.split("/").pop()}: ${
      stats.isDirectory() ? "directory" : "file"
    }`
  );

  if (stats.isDirectory()) {
    // If it's a directory, create the directory on the remote server
    await createDir(sshClient, remotePath);

    // Read the directory and upload its contents recursively
    const subItems = fs.readdirSync(localPath).filter(filterFunc);
    for (const subItem of subItems) {
      const subLocalPath = path.join(localPath, subItem);
      const newRemotePath = path.join(remotePath, subItem);

      await uploadRecursive(subLocalPath, newRemotePath, subItem, sshClient);
    }
  } else {
    // If it's a file, upload it to the remote server
    console.log(`Uploading ${localPath} to ${remotePath}`);
    await sendFile(sshClient, localPath, remotePath);
  }
};

async function createDir(sshClient, remotePath) {
  return new Promise((resolve, reject) => {
    sshClient.sftp((err, sftp) => {
      if (err) {
        sftp.end();
        return reject(err);
      }

      // Check if the directory already exists
      sftp.readdir(remotePath, (err) => {
        if (!err) {
          // Directory already exists, resolve immediately
          console.log(`Directory ${remotePath} already exists`);
          sftp.end();
          return resolve();
        }

        // If readdir throws an error, it means the directory doesn't exist
        // Attempt to create the directory
        sftp.mkdir(remotePath, (err) => {
          if (err) {
            return reject(err);
          }
          console.log(`Created directory ${remotePath}`);
          sftp.end();
          resolve();
        });
      });
    });
  });
}

// // Refactor to use sftp connection
// async function sendFile(sftp, localPath, remotePath) {
//   console.log(`Sending file ${localPath} to ${remotePath}`);
//   return await sftp.fastPut(localPath, remotePath, (err) =>
//     err ? Promise.reject(err) : Promise.resolve()
//   );
// }

// Send a file to the EC2 instance
async function sendFile(sshClient, localPath, remotePath) {
  console.log(`Sending file ${localPath} to ${remotePath}`);
  return await new Promise((resolve, reject) => {
    sshClient.sftp((err, sftp) => {
      if (err) {
        sftp.end();
        return reject(err);
      }
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          sftp.end();
          return reject(err);
        }
        sftp.end();
        resolve();
      });
    });
  });
}

// Filter function to exclude node_modules and package-lock.json
const filterFunc = (fileName) => {
  return (
    !["node_modules", "package-lock.json", "instanceData.json"].includes(
      fileName
    ) && !fileName.endsWith(".pem")
  );
};

// Connect the given sshClient to the server specified in the connectionParams
async function sshConnect(sshClient, connectionParams) {
  console.log(connectionParams);
  const { hostName, username, privateKeyPath } = connectionParams;
  return await new Promise((resolve, reject) => {
    sshClient.on("error", reject);
    sshClient.on("ready", resolve);
    sshClient.connect({
      host: hostName,
      username: username,
      privateKey: fs.readFileSync(privateKeyPath),
    });
  });
}

async function getSftpConnection(sshClient) {
  try {
    const sftp = await sshClient.sftp((err, sftp) =>
      err ? Promise.reject(err) : Promise.resolve(sftp)
    );
    return sftp;
  } catch (err) {
    console.error("Error creating sftp connection:", err);
  }
}
