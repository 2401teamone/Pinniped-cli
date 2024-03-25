import {
  EC2Client,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateKeyPairCommand,
  RunInstancesCommand,
} from "@aws-sdk/client-ec2";
import { writeFile } from "fs/promises";

// Create EC2 service client
const ec2Client = new EC2Client({ region: "us-east-2" });

async function createSecurityGroup() {
  try {
    // Specify parameters for creating the security group
    const securityGroupParams = {
      Description: "Allow SSH, HTTP, and HTTPS traffic",
      GroupName: "Pinniped-Security4",
    };

    // Create the security group
    const { GroupId } = await ec2Client.send(
      new CreateSecurityGroupCommand(securityGroupParams)
    );
    console.log("Security group created with ID:", GroupId);

    // Specify parameters for authorizing ingress traffic
    const authorizeParams = {
      GroupId,
      IpPermissions: [
        {
          IpProtocol: "tcp",
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }], // Allow SSH traffic from any IP address
        },
        {
          IpProtocol: "tcp",
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }], // Allow HTTP traffic from any IP address
        },
        {
          IpProtocol: "tcp",
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: "0.0.0.0/0" }], // Allow HTTPS traffic from any IP address
        },
        // Add additional ingress rules as needed
      ],
    };

    // Authorize ingress traffic for the security group
    await ec2Client.send(
      new AuthorizeSecurityGroupIngressCommand(authorizeParams)
    );
    console.log("Ingress traffic authorized for security group");

    return GroupId;
  } catch (error) {
    console.error("Error creating security group:", error);
  }
}

async function createKeyPair() {
  try {
    // Specify parameters for creating the key pair
    const params = {
      KeyName: "pinniped-open1",
    };

    // Create the key pair
    const data = await ec2Client.send(new CreateKeyPairCommand(params));
    console.log("Key pair created:", data.KeyName);

    // Write the key material to a PEM file
    await writeFile("pinniped-open1.pem", data.KeyMaterial);
  } catch (error) {
    console.error("Error creating key pair:", error);
  }
}

async function launchInstance(securityGroupId) {
  try {
    // Specify parameters for launching the EC2 instance
    const instanceParams = {
      ImageId: "ami-0b8b44ec9a8f90422", // AMI ID
      InstanceType: "t2.nano", // Instance type
      KeyName: "pinniped-open1", // Key pair name
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: [securityGroupId], // Use the created security group ID
      // Additional parameters as needed
    };

    // Launch the EC2 instance
    const data = await ec2Client.send(new RunInstancesCommand(instanceParams));
    console.log("Created instance:", data.Instances[0].InstanceId);
  } catch (error) {
    console.error("Error launching instance:", error);
  }
}

// Execute the functions sequentially
(async () => {
  const securityGroupID = await createSecurityGroup();
  await createKeyPair();

  await launchInstance(securityGroupID);
})();
