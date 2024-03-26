import { NodeSSH } from "node-ssh";

export default async function runCommandOnEC2(connectionParams, command) {
  const ssh = new NodeSSH();

  try {
    await ssh.connect({
      host: connectionParams.hostName,
      username: connectionParams.username,
      privateKeyPath: connectionParams.privateKeyPath,
      port: 22,
    });

    console.log("Connected to the server");

    const result = await ssh.execCommand(command);

    console.log("STDOUT:", result.stdout);

    console.log("STDERR:", result.stderr);
    ssh.dispose();
  } catch (error) {
    console.error("Error:", error);
  }
}
