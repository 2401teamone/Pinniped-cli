import AWS from "aws-sdk";
import fs from "fs";

// Load credentials and set region from JSON file
AWS.config.update({ region: "us-east-2" });

// Create EC2 service object
const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

// Specify parameters for creating the security group
const securityGroupParams = {
  Description: "Allow SSH, HTTP, and HTTPS traffic",
  GroupName: "Pinniped-Security3",
};

// Create the security group
ec2.createSecurityGroup(securityGroupParams, function (err, data) {
  if (err) {
    console.error("Error creating security group:", err);
  } else {
    const securityGroupId = data.GroupId;
    console.log("Security group created with ID:", securityGroupId);

    // Specify parameters for authorizing ingress traffic
    const authorizeParams = {
      GroupId: securityGroupId,
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
    ec2.authorizeSecurityGroupIngress(authorizeParams, function (err, data) {
      if (err) {
        console.error("Error authorizing security group ingress:", err);
      } else {
        console.log("Ingress traffic authorized for security group");
      }

      let params = {
        KeyName: "pinniped-open",
      };

      // Create the key pair     https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ec2-example-key-pairs.html
      ec2.createKeyPair(params, function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log(JSON.stringify(data));
          fs.writeFileSync("pinniped-open.pem", data.KeyMaterial);
        }
      });

      // Specify parameters for launching the EC2 instance
      const instanceParams = {
        ImageId: "ami-0b8b44ec9a8f90422", // AMI ID
        InstanceType: "t2.nano", // Instance type
        KeyName: "pinniped-open", // Key pair name
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [securityGroupId], // Use the created security group ID
        // Additional parameters as needed
      };

      // Create a promise on the EC2 service object to launch the instance
      const instancePromise = ec2.runInstances(instanceParams).promise();

      // Handle promise's fulfilled/rejected states
      instancePromise
        .then((data) => {
          console.log("Created instance:", data.Instances[0].InstanceId);
        })
        .catch((err) => {
          console.error("Error creating instance:", err);
        });
    });
  }
});
