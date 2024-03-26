// import fs from "fs";
// import { Client } from "ssh2";

// export default async function uploadFilesToEC2(connectionParams) {
//   const { hostName, username, privateKeyPath } = connectionParams;

//   const localFilePath = "index.js";
//   const remoteFilePath = "/home/ubuntu/index.js";

//   // Create SSH connection
//   const sshClient = new Client();
//   await new Promise((resolve, reject) => {
//     sshClient.on("error", reject);
//     sshClient.on("ready", resolve);
//     sshClient.connect({
//       host: hostName,
//       username: username,
//       privateKey: fs.readFileSync(privateKeyPath),
//     });
//   });

//   // SCP the file to the EC2 instance
//   await new Promise((resolve, reject) => {
//     sshClient.sftp((err, sftp) => {
//       if (err) {
//         sshClient.end();
//         return reject(err);
//       }
//       sftp.fastPut(localFilePath, remoteFilePath, (err) => {
//         sshClient.end();
//         if (err) {
//           return reject(err);
//         }
//         resolve();
//       });
//     });
//   });

//   console.log("File uploaded successfully.");
// }

// import fs from "fs";
// import path from "path";
// import { Client } from "ssh2";

// // Filter function to exclude node_modules and package-lock.json
// const filterFunc = (fileName) => {
//   return !["node_modules", "package-lock.json"].includes(fileName);
// };

// export default async function uploadFilesToEC2(connectionParams) {
//   const { hostName, username, privateKeyPath } = connectionParams;
//   const localDir = process.cwd(); // Current working directory

//   // Get list of files and directories in the current working directory
//   const items = fs.readdirSync(localDir);

//   console.log(items);

//   // Filter out node_modules and package-lock.json
//   const filesToUpload = items.filter(filterFunc);

//   console.log(filesToUpload);

//   // Create SSH connection
//   const sshClient = new Client();
//   await new Promise((resolve, reject) => {
//     sshClient.on("error", reject);
//     sshClient.on("ready", resolve);
//     sshClient.connect({
//       host: hostName,
//       username: username,
//       privateKey: fs.readFileSync(privateKeyPath),
//     });
//   });

//   // SCP each file/directory to the EC2 instance
//   for (const itemName of filesToUpload) {
//     const localPath = itemName;
//     const remotePath = `/home/ubuntu/${itemName}`;

//     console.log(`Uploading ${localPath} to ${remotePath}`);

//     await new Promise((resolve, reject) => {
//       sshClient.sftp((err, sftp) => {
//         if (err) {
//           sshClient.end();
//           return reject(err);
//         }
//         sftp.fastPut(localPath, remotePath, (err) => {
//           if (err) {
//             return reject(err);
//           }
//           resolve();
//         });
//       });
//     });
//   }

//   sshClient.end();
//   console.log("Files uploaded successfully.");
// }

import fs from "fs";
import path from "path";
import { Client } from "ssh2";
const DESTINATION_PATH = "/home/ubuntu/server";

// Main function to upload files/directories to EC2
export default async function uploadFilesToEC2(connectionParams) {
  const { hostName, username, privateKeyPath } = connectionParams;
  const localDir = process.cwd(); // Current working directory

  // Get list of files and directories in the current working directory
  const items = fs.readdirSync(localDir);

  // Filter out node_modules and package-lock.json
  const filesToUpload = items.filter(filterFunc);

  console.log(filesToUpload);

  // Create SSH connection
  const sshClient = new Client();
  await new Promise((resolve, reject) => {
    sshClient.on("error", reject);
    sshClient.on("ready", resolve);
    sshClient.connect({
      host: hostName,
      username: username,
      privateKey: fs.readFileSync(privateKeyPath),
    });
  });

  console.log("Connected to EC2 instance.");

  // Create server directory on the EC2 instance
  await new Promise((resolve, reject) => {
    sshClient.sftp((err, sftp) => {
      if (err) {
        return reject(err);
      }
      sftp.mkdir(DESTINATION_PATH, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });

  // Upload each file/directory
  for (const itemName of filesToUpload) {
    const localPath = path.join(localDir, itemName);
    const remotePath = "/home/ubuntu/server";

    console.log(`Uploading ${localPath} to ${remotePath}`);

    // Upload file or directory recursively
    await uploadRecursive(localPath, remotePath, sshClient);
  }

  sshClient.end();
  console.log("Files uploaded successfully.");
}

// Filter function to exclude node_modules and package-lock.json
const filterFunc = (fileName) => {
  return (
    !["node_modules", "package-lock.json"].includes(fileName) &&
    !fileName.endsWith(".pem")
  );
};

// Recursive function to upload files/directories
const uploadRecursive = async (localPath, remotePath, sshClient) => {
  const stats = fs.statSync(localPath);

  console.log(
    `File type of ${localPath}: ${stats.isDirectory() ? "directory" : "file"}`
  );

  if (stats.isDirectory()) {
    // If it's a directory, create the directory on the remote server
    const newRemotePath = path.join(remotePath, path.basename(localPath));
    await new Promise((resolve, reject) => {
      sshClient.sftp((err, sftp) => {
        if (err) {
          return reject(err);
        }
        sftp.mkdir(newRemotePath, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });

    // Read the directory and upload its contents recursively
    const subItems = fs.readdirSync(localPath);
    for (const subItem of subItems) {
      const subLocalPath = path.join(localPath, subItem);
      await uploadRecursive(subLocalPath, newRemotePath, sshClient);
    }
  } else {
    // If it's a file, upload it to the remote server
    const remoteFilePath = path.join(remotePath, path.basename(localPath));
    await new Promise((resolve, reject) => {
      sshClient.sftp((err, sftp) => {
        if (err) {
          return reject(err);
        }
        sftp.fastPut(localPath, remoteFilePath, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
};
