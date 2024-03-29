// Purpose: This file contains the code to provision an EC2 instance on AWS
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import provisionEC2 from "../utils/provisionEC2.js";
import { findUbuntuArm64AmiId } from "../utils/provisionEC2.js";
import setFilePermissions from "../utils/setFilePermissions.js";
import { storeInstanceData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "TEST COMMAND";

const test = async (agrv) => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  // Get the region and instance type from the user
  let answers = await inquirer.prompt([
    {
      type: "list",
      name: "region",
      message: "Select the AWS region for deployment:",
      choices: ui.regions.map((region) => ({ name: region, value: region })),
    },
    {
      type: "list",
      name: "instanceType",
      message: "Select the EC2 instance type for deployment:",
      choices: ui.instanceTypes.map((type) => ({ name: type, value: type })),
    },
  ]);

  // Get the name of the current working directory
  answers.projectName = process.cwd().split("/").pop();

  // Get the AMI ID for the selected region
  answers.amiId = await findUbuntuArm64AmiId(answers.region);

  console.log(answers.amiId);

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Provisioning AWS EC2 instance. This may take a few minutes...`
      )
    );

    // const connectionParams = await provisionEC2(answers, spinner);

    // // Add the IP address of the EC2 instance to the instances.json file
    // await storeInstanceData(connectionParams);

    // await setFilePermissions(connectionParams.privateKeyPath);

    // spinner.text = "Performing status checks...";
    // // Delay for 15 seconds to allow the EC2 instance to be fully provisioned
    // await new Promise((resolve) => setTimeout(resolve, 20000));

    // // Run a command on the EC2 instance to install Node.js
    // const sshClient = new SSHClient(connectionParams, spinner);

    // await sshClient.runCommand("installNode");
    // await sshClient.runCommand("installPM2");
    // await sshClient.runCommand("update");
    // await sshClient.runCommand("installLibcap2Bin");
    // await sshClient.runCommand("setcap");

    // sshClient.closeConnection();

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

export default test;
