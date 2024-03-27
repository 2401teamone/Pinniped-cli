// Purpose: This file contains the code to provision an EC2 instance on AWS
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import provisionEC2 from "../utils/provisionEC2.js";
import runCommandOnEC2 from "../utils/runEC2Command.js";
import setFilePermissions from "../utils/setFilePermissions.js";
import { storeInstanceData } from "../utils/instanceData.js";

const provision = async (agrv) => {
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

  try {
    //start a loading spinner
    const spinner = ui.runSpinner(
      ui.colorStandard(
        `Provisioning AWS EC2 instance. This may take a few minutes...`
      )
    );

    const connectionParams = await provisionEC2(answers);

    // Add the IP address of the EC2 instance to the instances.json file
    await storeInstanceData(connectionParams);

    spinner.text = "Installing node.js on the EC2 instance";

    await setFilePermissions(connectionParams.privateKeyPath);

    const installNodeCmd =
      "DEBIAN_FRONTEND=noninteractive curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs";

    // Delay for 15 seconds to allow the EC2 instance to be fully provisioned
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Run a command on the EC2 instance to install Node.js
    await runCommandOnEC2(connectionParams, installNodeCmd);
    spinner.succeed(ui.colorSuccess("Ec2 instance provisioned successfully"));

    ui.boxMsg(
      "EC2 instance details are avialable in the `instanceData.json` file in your project directory" +
        "\nRun `pinniped deploy` to deploy the project to the EC2 instance"
    );
  } catch (err) {
    console.log(err);
    spinner.fail(ui.colorError("Provisioning failed"));
  }
};

export default provision;
