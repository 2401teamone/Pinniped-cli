// Purpose: This file contains the code to provision an EC2 instance on AWS
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import setFilePermissions from "../utils/setFilePermissions.js";
import { storeEC2MetaData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
import AWSClient from "../models/awsClient.js";
const COMMAND_HEADER_MSG = "Pinniped Provision";

const provision = async (agrv) => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  // Get the region and instance type from the user
  let answers = await inquirer.prompt([
    {
      type: "list",
      name: "region",
      message: "Select the AWS region for deployment:",
      choices: ui.regions,
    },
    {
      type: "list",
      name: "instanceType",
      message: "Select the EC2 instance type for deployment:",
      choices: ui.instanceTypes,
    },
    {
      type: "list",
      name: "EC2Name",
      message:
        "Choose a name for your EC2 instance and cooresponding ssh key: \n\n ",
      choices: [process.cwd().split("/").pop(), "Enter a different name"].map(
        (name) => ({ name: name, value: name })
      ),
    },
  ]);

  if (answers.EC2Name === "Enter a different name") {
    let newAnswer = await inquirer.prompt([
      {
        type: "input",
        name: "EC2Name",
        message:
          "Enter a name for your EC2 instance: \n\n" +
          "Must be unique, and contain only letters, numbers, and dashes \n\n",
        validate: async (input) => {
          if (
            /^[a-zA-Z0-9-]+$/.test(input) &&
            input.length > 0 &&
            input.length < 255
          ) {
            return true;
          }
          return "Invalid name. Must be unique, contain only letters, numbers, and dashes";
        },
      },
    ]);
    answers.EC2Name = newAnswer.EC2Name;
  }

  //start a loading spinner
  const spinner = ui.runSpinner(
    ui.colorStandard(
      `Provisioning AWS EC2 instance. This may take a few minutes...`
    )
  );

  try {
    const awsClient = new AWSClient(answers.region, spinner);

    await awsClient.provisionEC2(answers.instanceType, answers.EC2Name);

    const EC2MetaData = awsClient.getEC2MetaData();

    // Add the IP address of the EC2 instance to the instances.json file
    await storeEC2MetaData(EC2MetaData);

    await setFilePermissions(EC2MetaData.privateKeyPath);

    // Run a commands on the EC2 instance to install necessary dependencies and set permissions
    const sshClient = new SSHClient(EC2MetaData, spinner);

    await sshClient.connect(10);

    await sshClient.runCommand("installNode");
    await sshClient.runCommand("installPM2");
    await sshClient.runCommand("update");
    await sshClient.runCommand("installLibcap2Bin");
    await sshClient.runCommand("setcap");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Ec2 instance provisioned successfully"));

    ui.space();
    ui.print(
      "  EC2 instance details are available in the `instanceData.json` file in your project directory\n" +
        "  Run `pinniped deploy` to deploy the project to the EC2 instance"
    );
    ui.space();
  } catch (err) {
    console.log(err);
    spinner.fail(ui.colorError("Provisioning failed"));
  }
};

export default provision;
