import {
  EC2Client,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateKeyPairCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  RunInstancesCommand,
} from "@aws-sdk/client-ec2";
import { writeFile } from "fs/promises";

const AMI_ID = "ami-0b8b44ec9a8f90422";
const ARM_AMI_ID = "ami-0000456e99b2b6a9d";
const USERNAME = "ubuntu";
const SECURITY_GROUP = "Pinniped-Security";

export default async function provisionEC2(answers, spinner) {
  // Create EC2 service client
  const ec2Client = new EC2Client({ region: answers.region });

  // Create "Pinniped-Security" and configure security group if it does not exist
  let securityGroupID = await getSecurityGroupId(ec2Client);
  if (!securityGroupID) {
    securityGroupID = await createSecurityGroup(ec2Client, spinner);
  }

  // Create EC2 key pair for SSH access
  await createKeyPair(ec2Client, answers.projectName, spinner);

  // Specify parameters for launching the EC2 instance
  const instanceParams = {
    ImageId: ARM_AMI_ID,
    InstanceType: answers.instanceType, // Instance type
    KeyName: answers.projectName, // Key pair name
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: [securityGroupID], // Use the created security group ID
  };

  // Launch an EC2 instance with the created security group
  const { hostName } = await launchInstance(ec2Client, instanceParams, spinner);

  return {
    hostName,
    username: USERNAME,
    privateKeyPath: `${answers.projectName}.pem`,
  };
}

export async function getSecurityGroupId(ec2Client) {
  try {
    // Specify parameters for describing security groups
    const describeParams = {
      Filters: [
        {
          Name: "group-name",
          Values: [SECURITY_GROUP],
        },
      ],
    };

    // Describe existing security groups
    const data = await ec2Client.send(
      new DescribeSecurityGroupsCommand(describeParams)
    );

    if (data.SecurityGroups.length > 0) {
      // Security group with the specified name exists
      return data.SecurityGroups[0].GroupId;
    } else {
      // Security group with the specified name does not exist
      return undefined;
    }
  } catch (error) {
    console.error("Error describing security groups:", error);
    return undefined;
  }
}

export async function createSecurityGroup(ec2Client, spinner) {
  try {
    // Specify parameters for creating the security group
    const securityGroupParams = {
      Description: "Allow SSH, HTTP, and HTTPS traffic",
      GroupName: SECURITY_GROUP,
    };

    // Create the security group
    const { GroupId } = await ec2Client.send(
      new CreateSecurityGroupCommand(securityGroupParams)
    );
    spinner.text = `Security group created with ID:, ${GroupId}`;

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
      ],
    };

    // Authorize ingress traffic for the security group
    await ec2Client.send(
      new AuthorizeSecurityGroupIngressCommand(authorizeParams)
    );
    spinner.text = "Ingress traffic authorized for security group";

    return GroupId;
  } catch (error) {
    console.error("Error creating security group:", error);
  }
}

/**
 * Create an EC2 key pair for SSH access
 * @param {EC2Client} ec2Client - The EC2 service client
 * @param {string} KeyName - The name of the key pair
 * @returns {string} The file name of the key pair
 * @throws {Error} If an error occurs
 */
export async function createKeyPair(ec2Client, KeyName, spinner) {
  try {
    // Create the key pair
    const data = await ec2Client.send(new CreateKeyPairCommand({ KeyName }));
    spinner.text = `Key pair created:, ${data.KeyName}`;

    // Write the key material to a PEM file
    const fileName = `${KeyName}.pem`;
    await writeFile(fileName, data.KeyMaterial);
    return fileName;
  } catch (error) {
    console.error("Error creating key pair:", error);
  }
}

/**
 * Launch an EC2 instance with the specified security group
 * @param {EC2Client} ec2Client - The EC2 service client
 * @param {string} securityGroupId - The ID of the security group
 * @returns {Object} The data of the launched instance and the public IPv4 address
 * @throws {Error} If an error occurs
 */
export async function launchInstance(ec2Client, instanceParams, spinner) {
  try {
    // Launch the EC2 instance
    const data = await ec2Client.send(new RunInstancesCommand(instanceParams));

    spinner.text = "Instance initializing...";

    // Describe the instance to retrieve its state
    const describeParams = {
      InstanceIds: [data.Instances[0].InstanceId],
    };

    let instanceState = null;
    while (instanceState !== "running") {
      const describeData = await ec2Client.send(
        new DescribeInstancesCommand(describeParams)
      );
      instanceState = describeData.Reservations[0].Instances[0].State.Name;

      if (instanceState !== "running") {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before polling again
      }
    }

    spinner.text = "Instance is now running";

    // Describe the instance again to retrieve public IPv4 address (host name)
    const describeData = await ec2Client.send(
      new DescribeInstancesCommand(describeParams)
    );
    const publicIpAddress =
      describeData.Reservations[0].Instances[0].PublicIpAddress;

    // Return the data along with the public IPv4 address (host name)
    return { instanceData: data, hostName: publicIpAddress };
  } catch (error) {
    console.error("Error launching instance:", error);
    return null;
  }
}
