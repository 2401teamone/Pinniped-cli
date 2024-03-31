import {
  EC2Client,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateKeyPairCommand,
  DescribeSecurityGroupsCommand,
  DescribeImagesCommand,
  DescribeInstancesCommand,
  RunInstancesCommand,
} from "@aws-sdk/client-ec2";
import { writeFile } from "fs/promises";

export default class AWSClient {
  static USERNAME = "ubuntu";
  static SECURITY_GROUP = "Pinniped-Security";
  static IMAGE_PARAMS = {
    Filters: [
      {
        Name: "architecture",
        Values: ["x86_64"],
      },
      {
        Name: "name",
        Values: ["*ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"],
      },
      {
        Name: "state",
        Values: ["available"],
      },
    ],
    Owners: ["099720109477"], // Canonical's owner ID remains the same
  };

  /**
   * Constructor for the AWSClient class
   * @param {string} region - The AWS region to use
   * @param {object} spinner - The ora spinner object to use for logging
   * @param {string} instanceId - Optional - The ID of the EC2 instance to manage
   */
  constructor(region, spinner, instanceId) {
    // Properties set during initialization
    this.region = region;
    this.spinner = spinner;
    this.ec2Client = new EC2Client({ region });

    //Properties set during EC2 provisioning
    this.securityGroupID;
    this.amiId;
    this.instanceId = instanceId;
    this.publicIpAddress;
    this.keyFile;

    //Status Properties
    this.instanceState;
  }

  /**
   *  Method to provision an EC2 instance with the specified parameters
   * @returns {Promise<void>} - Resolves when provisioning is complete
   * @throws {Error} - If an error occurs during provisioning
   */
  async provisionEC2(instanceType, keyName) {
    this.instanceType = instanceType;

    // Create "Pinniped-Security" and configure security group if it does not exist
    this.securityGroupID = await this.getSecurityGroupId();
    if (!this.securityGroupID) {
      await this.createSecurityGroup();
    }

    // Create EC2 key pair for SSH access
    await this.createKeyPair(keyName);

    // Find the latest Ubuntu x86_64 AMI ID for the selected region
    this.amiId = await this.getAmiId();

    // Launch an EC2 instance with the created security group
    await this.launchEC2Instance(
      this.amiId,
      instanceType,
      keyName,
      this.securityGroupID
    );
  }

  /**
   * Method to poll the EC2 instance state and update the instanceState and
   * publicIpAddress properties of the instance.
   * Can be called without previously running launchEC2Instance, if you pass the
   * instance ID as a parameter.
   * @param {string} instanceId - The instance ID to poll
   * @returns {Promise<void>}
   */
  async syncEC2State(instanceId = this.instanceId) {
    const describeData = await this.ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const instanceData = describeData.Reservations[0].Instances[0];

    this.instanceState = instanceData.State.Name;
    this.publicIpAddress = instanceData.PublicIpAddress;
    this.amiId = instanceData.ImageId;
    this.instanceType = instanceData.InstanceType;
    this.keyName = instanceData.KeyName;
    this.sandwhich = "blt";
  }

  /**
   * Method to get the EC2 metadata for the instance
   * @returns {object} - The EC2 metadata for the instance
   */
  getEC2MetaData() {
    return {
      publicIpAddress: this.publicIpAddress,
      instanceId: this.instanceId,
      username: AWSClient.USERNAME,
      privateKeyPath: this.keyFile,
      region: this.region,
      instanceType: this.instanceType,
      amiId: this.amiId,
    };
  }

  /**
   * Method to describe existing security groups and return the ID of the
   * security group with the specified name
   * @returns {Promise<string>} - The ID of the security group with the specified name
   * @throws {Error} - If an error occurs describing security groups
   */
  async getSecurityGroupId() {
    try {
      // Specify parameters for describing security groups
      const describeParams = {
        Filters: [
          {
            Name: "group-name",
            Values: [AWSClient.SECURITY_GROUP],
          },
        ],
      };

      // Describe existing security groups
      const data = await this.ec2Client.send(
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

  /**
   * Method to create a security group with the specified name and authorize
   * ingress traffic for SSH, HTTP, and HTTPS
   * @returns {Promise<void>} - Resolves when the security group is created
   * @throws {Error} - If an error occurs creating the security group
   */
  async createSecurityGroup() {
    try {
      // Specify parameters for creating the security group
      const securityGroupParams = {
        Description: "Allow SSH, HTTP, and HTTPS traffic",
        GroupName: AWSClient.SECURITY_GROUP,
      };

      // Create the security group
      const { GroupId } = await this.ec2Client.send(
        new CreateSecurityGroupCommand(securityGroupParams)
      );
      this.securityGroupID = GroupId;
      this.spinner.text = `Security group created with ID:, ${GroupId}`;

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
      await this.ec2Client.send(
        new AuthorizeSecurityGroupIngressCommand(authorizeParams)
      );
      this.spinner.text = "Ingress traffic authorized for security group";
    } catch (error) {
      console.error("Error creating security group:", error);
    }
  }

  /**
   * Method to create an EC2 key pair and write the key material to a PEM file
   * @returns {Promise<string>} - The file name of the PEM file
   * @throws {Error} - If an error occurs creating the key pair
   */
  async createKeyPair(keyName) {
    try {
      // Create the key pair
      const keyData = await this.ec2Client.send(
        new CreateKeyPairCommand({ KeyName: keyName })
      );
      this.spinner.text = `Key pair created:, ${keyData.KeyName}`;

      // Write the key material to a PEM file
      const fileName = `${keyName}.pem`;
      await writeFile(fileName, keyData.KeyMaterial);
      this.keyFile = fileName;
    } catch (error) {
      console.error("Error creating key pair:", error);
    }
  }

  /**
   * Method to find the most recent Ubuntu AMI ID for the selected region
   * @returns {Promise<string>} - The most recent Ubuntu AMI ID
   */
  async getAmiId() {
    try {
      const command = new DescribeImagesCommand(AWSClient.IMAGE_PARAMS);
      const amiIds = await this.ec2Client.send(command);

      // Sort images by creation date in descending order
      const sortedImages = amiIds.Images.sort((a, b) =>
        b.CreationDate.localeCompare(a.CreationDate)
      );

      if (sortedImages.length > 0) {
        this.spinner.text = `Image found: ${sortedImages[0].ImageId}`;
        return sortedImages[0].ImageId; // Return the most recent AMI ID
      } else {
        throw new Error("No suitable AMI found.");
      }
    } catch (error) {
      console.error("Error finding Ubuntu AMI:", error);
      throw error;
    }
  }

  /**
   * Launches an EC2 instance and stores the instance ID
   * Can only be called after the instanceParams property is set
   * @returns {Promise<void>}
   */
  async launchEC2Instance(amiId, instanceType, keyName, securityGroupID) {
    const ec2LaunchParams = {
      ImageId: amiId,
      InstanceType: instanceType,
      KeyName: keyName,
      MaxCount: 1,
      MinCount: 1,
      // SecurityGroups: [AWSClient.SECURITY_GROUP],
      SecurityGroupIds: [securityGroupID],
    };

    try {
      // Launch the EC2 instance
      const instanceData = await this.ec2Client.send(
        new RunInstancesCommand(ec2LaunchParams)
      );

      // Store the instance ID
      this.instanceId = instanceData.Instances[0].InstanceId;

      this.spinner.text = "Instance initializing...";

      // Poll the EC2 instance state until it is "running"
      while (this.instanceState !== "running") {
        await this.syncEC2State();

        if (this.instanceState !== "running") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      this.spinner.text = "Instance is now running";
    } catch (error) {
      console.error("Error launching instance:", error);
      return null;
    }
  }
}
