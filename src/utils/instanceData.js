import { EC2 } from "@aws-sdk/client-ec2";
import fs from "fs/promises";

const INSTANCE_DATA_FILE = "instanceData.json";

export async function readEC2MetaData() {
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

export async function storeEC2MetaData(EC2MetaData) {
  const instanceData = await readEC2MetaData();

  instanceData.unshift({
    publicIpAddress: EC2MetaData.publicIpAddress,
    region: EC2MetaData.region,
    instanceType: EC2MetaData.instanceType,
    amiId: EC2MetaData.amiId,
    provisionedAt: new Date().toISOString(),
    sshKey: EC2MetaData.privateKeyPath,
    userName: EC2MetaData.username,
    sshCommand: `ssh -i ${EC2MetaData.privateKeyPath} ${EC2MetaData.username}@${EC2MetaData.publicIpAddress}`,
  });

  await fs.writeFile(INSTANCE_DATA_FILE, JSON.stringify(instanceData, null, 2));
}
