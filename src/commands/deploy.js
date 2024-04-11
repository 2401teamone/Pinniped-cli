import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readEC2MetaData, getInstanceChoices } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Deploy";

const deploy = async () => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will send the project files from your current\n" +
        "  working directory to your provisioned EC2 instance\n" +
        "  and install dependecies.\n\n" +
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
  const instanceChoices = await getInstanceChoices();

  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the EC2 instance for deployment: \n\n",
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

    const localDirPath = process.cwd();
    const remoteDirPath = "/home/ubuntu/server";

    const sshClient = new SSHClient(EC2MetaData[answers.instance], spinner);
    await sshClient.syncFiles(localDirPath, remoteDirPath, "all");

    await sshClient.connect();
    await sshClient.runCommand("installDependencies");
    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Deployed Successfully!"));
    ui.space();
  } catch (err) {
    console.log(err);
  }
};

export default deploy;
