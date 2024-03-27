import fs from "fs/promises";

const INSTANCE_DATA_FILE = "instanceData.json";

export async function readInstanceData() {
  try {
    const data = await fs.readFile(INSTANCE_DATA_FILE);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

export async function storeInstanceData(connectionParams) {
  const { hostName, username, privateKeyPath } = connectionParams;
  const instanceData = await readInstanceData();
  instanceData.unshift({
    ipAddress: hostName,
    provisionedAt: new Date().toISOString(),
    sshKey: privateKeyPath,
    userName: username,
    sshCommand: `ssh -i ${privateKeyPath} ${username}@${hostName}`,
  });
  await fs.writeFile(INSTANCE_DATA_FILE, JSON.stringify(instanceData, null, 2));
}
