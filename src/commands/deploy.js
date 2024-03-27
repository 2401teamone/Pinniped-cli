// Purpose: Deploy the project to the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import uploadFilesToEC2 from "../utils/uploadFilesToEC2.js";
import { readInstanceData } from "../utils/instanceData.js";

const deploy = async (agrv) => {
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

    const connectionParams = {
      hostName: instanceData[answers.instance].ipAddress,
      username: instanceData[answers.instance].userName,
      privateKeyPath: instanceData[answers.instance].sshKey,
    };

    await uploadFilesToEC2(connectionParams, spinner);

    spinner.succeed(ui.colorSuccess("Project files copied successfully"));

    ui.boxMsg("Run `pinniped start` to start your server on the EC2 instance");
  } catch (err) {
    console.log(err);
  }
};

export default deploy;
