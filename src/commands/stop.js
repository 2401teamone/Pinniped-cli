import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readEC2MetaData, getInstanceChoices } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Stop";

const stop = async () => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will stop your deployed application using pm2 process manager.\n\n" +
        "  Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Stop command cancelled. \n  Please run `pinniped info` help using this CLI.\n"
    );
    return;
  }
  const EC2MetaData = await readEC2MetaData();
  const instanceChoices = await getInstanceChoices();

  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the EC2 instance to stop: \n\n",
      choices: instanceChoices,
    },
  ]);

  try {
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Connecting to AWS EC2 instance. This may take a few seconds...`
      )
    );
    const sshClient = new SSHClient(EC2MetaData[answers.instance], spinner);

    await sshClient.connect();

    await sshClient.runCommand("stop");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project stopped successfully!"));
    ui.space();
  } catch (err) {
    console.log(err);
  }
};

export default stop;
