import { Client } from "ssh2";
import { readFileSync } from "fs";

export default async function runCommandOnEC2(
  connectionParams,
  command,
  spinner
) {
  const { hostName, username, privateKeyPath } = connectionParams;

  const sshClient = new Client();

  try {
    await new Promise((resolve, reject) => {
      sshClient.on("error", reject);
      sshClient.on("ready", resolve);
      sshClient.connect({
        host: hostName,
        username: username,
        privateKey: readFileSync(privateKeyPath),
        port: 22,
      });
    });

    spinner.text = "Connected to the server. Running command...";

    const { stdout, stderr } = await new Promise((resolve, reject) => {
      sshClient.exec(command, (err, stream) => {
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

    spinner.text = "Command executed successfully";
    sshClient.end();
  } catch (error) {
    console.error("Error:", error);
  }
}
