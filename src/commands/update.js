// Purpose: Deploy the project to the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readInstanceData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Update";

const update = async (agrv) => {
  const instanceData = await readInstanceData();

  const instanceChoices = instanceData.map((instance, idx) => ({
    name:
      idx === 0 ? `${instance.ipAddress} (Most Recent)` : instance.ipAddress,
    value: idx,
  }));

  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This process will: \n" +
        "  1. Stop your app running on your EC2 instance if it is running. \n" +
        "  2. Update files on your EC2 instance to match your local project directory. \n" +
        "  3. Re-start your app.  \n\n" +
        "     Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Update process cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }

  ui.commandHeader(COMMAND_HEADER_MSG);
  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the IP address of the EC2 instance to update: \n",
      choices: instanceChoices,
    },
    {
      type: "list",
      name: "type",
      message: "Select your update type: \n",
      choices: ui.updateOptions,
      pageSize: 20,
    },
  ]);
  const type = ui.updateOptions[answers.type].short;
  ui.commandHeader(COMMAND_HEADER_MSG + ` - Type: ${type}`);

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Connecting to AWS EC2 instance. This may take a few seconds...`
      )
    );

    const connectionParams = {
      hostName: instanceData[answers.instance].ipAddress,
      username: instanceData[answers.instance].userName,
      privateKeyPath: instanceData[answers.instance].sshKey,
    };

    const sshClient = new SSHClient(connectionParams, spinner);

    await sshClient.connect();

    await sshClient.runCommand("stop");

    await sshClient.runCommand("start");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Updated Successfully!"));

    ui.space();
  } catch (err) {
    console.log(err);
  }
};

export default update;
