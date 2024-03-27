import fs from "fs";
import path from "path";
import { Client } from "ssh2";
const DESTINATION_BASE_PATH = "/home/ubuntu/server";

// Main function to upload files/directories to EC2
export default async function uploadFilesToEC2(connectionParams, spinner) {
  // Create SSH connection
  let sshClient = new Client();

  await sshConnect(sshClient, connectionParams);

  const sftp = await getSftpConnection(sshClient);

  spinner.text = "Connected to EC2 instance.";

  // Create "server" directory on the EC2 instance
  await createDir(sshClient, DESTINATION_BASE_PATH);
  spinner.text = "Created `server` directory on EC2 instance";

  // Upload each file/directory
  const localDir = process.cwd();
  const items = fs.readdirSync(localDir).filter(filterFunc);

  spinner.text = "Copying project files to EC2 instance";
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = path.join(DESTINATION_BASE_PATH, item);

    await uploadRecursive(localPath, remotePath, sshClient, spinner);
  }
  sshClient.end();
}

// Recursive function to upload files/directories
const uploadRecursive = async (localPath, remotePath, sshClient, spinner) => {
  // Check if the item is a file or directory
  const stats = fs.statSync(localPath);

  if (stats.isDirectory()) {
    // If it's a directory, create the directory on the remote server
    await createDir(sshClient, remotePath);

    // Read the directory and upload its contents recursively
    const subItems = fs.readdirSync(localPath).filter(filterFunc);
    for (const subItem of subItems) {
      const subLocalPath = path.join(localPath, subItem);
      const newRemotePath = path.join(remotePath, subItem);

      await uploadRecursive(subLocalPath, newRemotePath, sshClient, spinner);
    }
  } else {
    // If it's a file, upload it to the remote server
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
          sftp.end();
          return resolve();
        }

        // If readdir throws an error, it means the directory doesn't exist
        // Attempt to create the directory
        sftp.mkdir(remotePath, (err) => {
          if (err) {
            return reject(err);
          }
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
