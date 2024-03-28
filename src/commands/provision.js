// Purpose: This file contains the code to provision an EC2 instance on AWS
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import provisionEC2 from "../utils/provisionEC2.js";
import setFilePermissions from "../utils/setFilePermissions.js";
import { storeInstanceData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Provision";

const provision = async (agrv) => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will: \n" +
        "  1. Provision a new AWS EC2 instnce. \n" +
        "  2. Create a `Pinniped-Security` security group in your chosen region. \n" +
        "  3. Create a EC2 Key Pair for use in connecting to your EC2 instance.\n\n" +
        "  You must have the aws cli installed and authenticated to perform this command.\n\n" +
        "  Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Provision command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }
  // Get the region and instance type from the user
  answers = await inquirer.prompt([
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

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Provisioning AWS EC2 instance. This may take a few minutes...`
      )
    );

    const connectionParams = await provisionEC2(answers, spinner);

    // Add the IP address of the EC2 instance to the instances.json file
    await storeInstanceData(connectionParams);

    await setFilePermissions(connectionParams.privateKeyPath);

    spinner.text = "Performing status checks...";
    // Delay for 15 seconds to allow the EC2 instance to be fully provisioned
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Run a command on the EC2 instance to install Node.js
    const sshClient = new SSHClient(connectionParams, spinner);

    await sshClient.runCommand("installNode");

    await sshClient.runCommand("installPM2");

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
