// Load the AWS SDK for Node.js
import AWS from "aws-sdk";
import fs from "fs";

// Load credentials and set region from JSON file
AWS.config.update({ region: "us-east-2" });

// Create EC2 service object
let ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

let params = {
  KeyName: "pinniped-test",
};

// Create the key pair     https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ec2-example-key-pairs.html
ec2.createKeyPair(params, function (err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log(JSON.stringify(data));
    fs.writeFileSync("pinniped-test.pem", data.KeyMaterial);
  }
});

//Specify details for the ec2 instance
let instanceParams = {
  ImageId: "ami-0b8b44ec9a8f90422", //What type of operating system should the ec2 instance use
  InstanceType: "t2.nano", // How big should it be?
  KeyName: "pinniped-test", //name for your instance
  MinCount: 1,
  MaxCount: 1,
  SecurityGroupIds: ["sg-1234567890abcdef0"],
};

// Create a promise on an EC2 service object
let instancePromise = new AWS.EC2({ apiVersion: "2016-11-15" })
  .runInstances(instanceParams)
  .promise();

// Handle promise's fulfilled/rejected states
instancePromise
  .then(function (data) {
    console.log(data);
    let instanceId = data.Instances[0].InstanceId;
    console.log("Created instance", instanceId);
    // Add tags to the instance
    let tagParams = {
      Resources: [instanceId],
      Tags: [
        {
          Key: "Name",
          Value: "SDK Sample",
        },
      ],
    };
    // Create a promise on an EC2 service object
    let tagPromise = new AWS.EC2({ apiVersion: "2016-11-15" })
      .createTags(tagParams)
      .promise();
    // Handle promise's fulfilled/rejected states
    tagPromise
      .then(function (data) {
        console.log("Instance tagged");
      })
      .catch(function (err) {
        console.error(err, err.stack);
      });
  })
  .catch(function (err) {
    console.error(err, err.stack);
  });

// Specify parameters for creating a security group
let securityGroupParams = {
  Description: "Allow SSH traffic",
  GroupName: "SSHAccess", // Specify a name for your security group
};

// Create the security group
ec2.createSecurityGroup(securityGroupParams, function (err, data) {
  if (err) {
    console.log("Error creating security group", err);
  } else {
    let securityGroupId = data.GroupId;
    console.log("Security group created with ID:", securityGroupId);

    // Specify parameters for authorizing SSH ingress traffic
    let authorizeParams = {
      GroupId: securityGroupId,
      IpPermissions: [
        {
          IpProtocol: "tcp",
          FromPort: 22, // SSH port
          ToPort: 22, // SSH port
          IpRanges: [{ CidrIp: "0.0.0.0/0" }], // Allow SSH traffic from any IP address
        },
      ],
    };

    // Authorize SSH ingress traffic for the security group
    ec2.authorizeSecurityGroupIngress(authorizeParams, function (err, data) {
      if (err) {
        console.log("Error authorizing security group ingress", err);
      } else {
        console.log("SSH ingress traffic authorized for security group");
      }
    });
  }
});

/*
{"KeyFingerprint":"51:b7:4e:07:3a:75:bf:ea:84:70:1a:96:f6:ba:42:54:fd:d4:fc:9f","KeyMaterial":"-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAn6zMuw2rdbnW1vrQdQ/sVv40/66sjQ3yKK3VSnn5czkYcH0E\np5DWTqEeB+bcfgt36V1oWHNTtil+amMCbsPvjqXz1sYx2Tvp0WK59/7GV4lSO5x6\nw7a2FCuphRPo0JjXlAzlNj7O76iAyEg837bs4YNFKB8zXtd5icdxCLbRNTe9e9xU\nuqelnc//P/TlUqjh3W2n45WuL00KlF6320UtLOkG0n66TP8FUIc2gv3rtOL5u0Nn\n9kbFagiOM6LX8XviqIVcQecVleSv/OPH/YXeovYxz1hOqnCosSazYx/l1a/MNZ6i\nvItnolHlDGHE7EJ+41c5SM7CS070ibJ3LI7AvwIDAQABAoIBAEuupM9YOFexgQIe\nmaWSqYvGK6qwyTqGTKw5UKpfS/vwKQRQTV97CAj21vwZ0ZKwruJekrGx4BCsdC3K\nxgFoP2iWgg/fmwsDGd1T9R91k98zyFVW4t1XAdBnrY7VE/mjKDMVNaNTe9QeQwQr\nMSc8VeTByoqs1zVx3jqO3KWruVeGVSYcelFkzA/Gmg/CbXZLYCSIH6WvDoJIA6sK\n0ko1Fga6j7S9HPTqmkyNJW9gN/HFbKah5MpfeDFXpAXNyM05IHk0TDYeI9/JmZhR\nBRiXHguXdYjsqkbSoOIxf9TXbL7WpF8SuRtiPLbvW7N4rAo31jxjAXSwCpNqE00s\nBaToaQECgYEA6vpuKlcHiLG0AHoXlyqDeIPj5dv1WF4Ka2MEseQX1swzN1gqg4R5\naWnRF1WDHbmSLtb5oNUt/S8/Y2tLS2qsm0Qb/kCOtHEihhFKqK1La+51EYLV510Y\nYXvW7UC8Jp9U4g/RJQ6l0d7hhWZocHjRDZqZw8Sq8d5RZWCcchbO0T8CgYEArfW+\nPBN6SjID1UAL02FGukFp4QkDZwn7HMPnJzG8nndRzGr3+LFmgSYM7XyIg/mKaY+z\n/Qqx3CRnXUo6Cj9wwwBBuzYLqT9ZadlQVwDQMAKxoBGuZN3uZ4YfcD2TXEPRePSe\nJKGIMZBoez/58ZsCvc2MARO/vNlPF8hyF+aEsIECgYEAimebwCCm9WMGTUmc35NR\nAQlekSOwLa6moH4gY8+gIwsAF9c8o17CTM7hM8dQhY+qhSBmxM8MWZcc1Sh7nx5k\nMMg7XNUVuT7yQNmqihQY2qgIGJph9/cjxze0bua0bGNpEgaTACrSjP2lBHg/iBAB\nwuuPKnqK3hA/DWGMhL7ebu0CgYEAhxbX1PVXOPjgCyFCTbMz5n3Xx/5k2wZgL/Vd\nsw0nqXOFXRYQXNr+e/pdfasApGQLfXAv2KgOeKL4dfSnX7/mRDgV01jj81mTiORO\nRFIIWdAtud0hLYk+krwP++yFW9f6elCT4mRiTAMVb+i9o0a5+UT+nPOGKRQkHJb3\nKuJDVoECgYBr4et6zTWrf96aIwp6XLNIIJnOjYzOqx35disqy8016+YwvHugn55H\nOCKD7cjWkMrdEtlAp0PAaTftZ0TTkgPrsRmq3MQ/4VkFtWiPe33Sln0nUWkwBkFN\nXVyCRaBpkn90sqX9sEiSqoOySYfuQqxDglHlNyfRKw0IK7bRw+itPA==\n-----END RSA PRIVATE KEY-----","KeyName":"pinniped-test3","KeyPairId":"key-00324cac6d4749041","Tags":[]}
*/
