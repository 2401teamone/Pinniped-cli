import { exec } from "child_process";

export default async function setFilePermissions(filename) {
  return new Promise((resolve, reject) => {
    exec(`chmod 400 ${filename}`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
