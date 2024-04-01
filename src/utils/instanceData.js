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

export async function getInstanceChoices() {
  const EC2MetaData = await readEC2MetaData();

  return EC2MetaData.map((instance, idx) => ({
    name:
      idx === 0
        ? `IP: ${
            instance.publicIpAddress
          } - EC2 Name: ${instance.privateKeyPath.slice(0, -4)} (Most Recent)`
        : `IP: ${
            instance.publicIpAddress
          } - EC2 Name: ${instance.privateKeyPath.slice(0, -4)}`,
    value: idx,
  }));
}

export async function EC2NameIsUnique(EC2Name) {
  const instanceData = await readEC2MetaData();
  console.log(instanceData);
  return !instanceData.some(
    (instance) => instance.privateKeyPath === `${EC2Name}.pem`
  );
}

export async function storeEC2MetaData(EC2MetaData) {
  const instanceData = await readEC2MetaData();

  instanceData.unshift({
    publicIpAddress: EC2MetaData.publicIpAddress,
    region: EC2MetaData.region,
    instanceType: EC2MetaData.instanceType,
    amiId: EC2MetaData.amiId,
    provisionedAt: new Date().toISOString(),
    privateKeyPath: EC2MetaData.privateKeyPath,
    username: EC2MetaData.username,
    sshCommand: `ssh -i ${EC2MetaData.privateKeyPath} ${EC2MetaData.username}@${EC2MetaData.publicIpAddress}`,
  });

  await fs.writeFile(INSTANCE_DATA_FILE, JSON.stringify(instanceData, null, 2));
}
