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
import { NodeSSH } from "node-ssh";
import { Client } from "ssh2";

// Create EC2 service client
const ec2Client = new EC2Client({ region: "us-east-2" });

async function getSecurityGroupId() {
  try {
    // Specify parameters for describing security groups
    const describeParams = {
      Filters: [
        {
          Name: "group-name",
          Values: ["Pinniped-Security"],
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

async function createSecurityGroup() {
  try {
    // Specify parameters for creating the security group
    const securityGroupParams = {
      Description: "Allow SSH, HTTP, and HTTPS traffic",
      GroupName: "Pinniped-Security",
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
      KeyName: "pinniped-open5",
    };

    // Create the key pair
    const data = await ec2Client.send(new CreateKeyPairCommand(params));
    console.log("Key pair created:", data.KeyName);

    // Write the key material to a PEM file
    await writeFile("pinniped-open5.pem", data.KeyMaterial);
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
      KeyName: "pinniped-open5", // Key pair name
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: [securityGroupId], // Use the created security group ID
      // Additional parameters as needed
    };

    // Launch the EC2 instance
    const data = await ec2Client.send(new RunInstancesCommand(instanceParams));
    console.log("Created instance:", data.Instances[0].InstanceId);

    console.log("Waiting for the instance to be running...");

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
        console.log("Instance is not yet running. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before polling again
      }
    }

    console.log("Instance is now running.");

    // Describe the instance again to retrieve public IPv4 address (host name)
    const describeData = await ec2Client.send(
      new DescribeInstancesCommand(describeParams)
    );
    const publicIpAddress =
      describeData.Reservations[0].Instances[0].PublicIpAddress;

    console.log("Host name (Public IPv4 address):", publicIpAddress);

    // Return the data along with the public IPv4 address (host name)
    return { instanceData: data, hostName: publicIpAddress };
  } catch (error) {
    console.error("Error launching instance:", error);
    return null;
  }
}

// Execute the functions sequentially
(async () => {
  let securityGroupID = await getSecurityGroupId();
  if (!securityGroupID) {
    securityGroupID = await createSecurityGroup();
  }

  await createKeyPair();

  const { hostName } = await launchInstance(securityGroupID);

  // const hostName = "3.143.244.226";

  const ssh = new NodeSSH();

  const username = "ubuntu";
  const privateKey = "pinniped-open5.pem";

  const installNodeCmd =
    "DEBIAN_FRONTEND=noninteractive curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs";

  ssh
    .connect({
      host: hostName,
      username: username,
      privateKeyPath: privateKey,
      port: 22,
    })
    .then(() => {
      console.log("Connected to the server");
      return ssh.execCommand(installNodeCmd);
    })
    .then((result) => {
      console.log("STDOUT:", result.stdout);
      console.log("STDERR:", result.stderr);
      ssh.dispose();
    })
    .catch((err) => {
      console.error("Error:", err);
    });
})();

// // Example usage
// const hostname = 'your-ec2-hostname';
// const username = 'ec2-user'; // or the username you use to SSH into the EC2 instance
// const privateKey = fs.readFileSync('path/to/your/privateKey.pem'); // Replace with the path to your private key
// const command = "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"; // Example command to run on the EC2 instance

// async function runCommandOnEC2(hostname, username, privateKey, command) {
//   return new Promise((resolve, reject) => {
//     const conn = new Client();

//     conn.on('ready', () => {
//       console.log('SSH connection established.');

//       conn.exec(command, (err, stream) => {
//         if (err) {
//           console.error('Error executing command:', err);
//           reject(err);
//         } else {
//           let output = '';

//           stream.on('data', (data) => {
//             output += data.toString();
//           });

//           stream.on('close', (code, signal) => {
//             console.log(`SSH command exited with code ${code}.`);
//             resolve(output);
//             conn.end();
//           });
//         }
//       });
//     });

//     conn.on('error', (err) => {
//       console.error('SSH connection error:', err);
//       reject(err);
//     });

//     conn.on('end', () => {
//       console.log('SSH connection closed.');
//     });

//     conn.connect({
//       host: hostname,
//       username: username,
//       privateKey: privateKey
//     });
//   });
// }
