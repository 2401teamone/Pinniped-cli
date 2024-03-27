// Purpose: Deploy the project to the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { readInstanceData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";

const stop = async (agrv) => {
  const instanceData = await readInstanceData();

  const instanceChoices = instanceData.map((instance, idx) => ({
    name:
      idx === 0 ? `${instance.ipAddress} (Most Recent)` : instance.ipAddress,
    value: idx,
  }));

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the IP address of the EC2 instance to stop:",
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

    const connectionParams = {
      hostName: instanceData[answers.instance].ipAddress,
      username: instanceData[answers.instance].userName,
      privateKeyPath: instanceData[answers.instance].sshKey,
    };

    const sshClient = new SSHClient(connectionParams, spinner);

    await sshClient.connect();

    await sshClient.runCommand("stop");

    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Stopped Successfully!"));

    ui.boxMsg(
      "Run `pinniped start` to start your server again on the EC2 instance"
    );
  } catch (err) {
    console.log(err);
  }
};

export default stop;
