// Purpose: Deploy the project to the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readEC2MetaData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Deploy";

const deploy = async (agrv) => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will send the project files from your current working\n" +
        "  directory to your provisioned EC2 instance and install dependecies.\n\n" +
        "  Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Deploy command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }

  const EC2MetaData = await readEC2MetaData();

  const instanceChoices = EC2MetaData.map((instance, idx) => ({
    name:
      idx === 0
        ? `${instance.publicIpAddress} (Most Recent)`
        : instance.publicIpAddress,
    value: idx,
  }));

  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the IP adress of the EC2 instance for deployment:",
      choices: instanceChoices,
    },
  ]);

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Connecting to AWS EC2 instance. This may take a few seconds...`
      )
    );

    const sshClient = new SSHClient(EC2MetaData[answers.instance], spinner);

    await sshClient.connect();

    const localDirPath = process.cwd();
    const remoteDirPath = "/home/ubuntu/server";

    await sshClient.syncFiles(localDirPath, remoteDirPath, "full");

    await sshClient.runCommand("installDependencies");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Deployed Successfully!"));

    ui.space();
    ui.print("Run `pinniped start` to start your server on the EC2 instance");
    ui.space();
  } catch (err) {
    console.log(err);
  }
};

export default deploy;
