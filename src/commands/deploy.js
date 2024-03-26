import fs from "fs-extra";
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import provision from "../utils/provision.js";
import runCommandOnEC2 from "../utils/runEC2Command.js";
import setFilePermissions from "../utils/setFilePermissions.js";

const deploy = async (agrv) => {
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

    const connectionParams = await provision(answers);
    spinner.text = "Installing node.js on the EC2 instance";

    await setFilePermissions(connectionParams.privateKeyPath);

    console.log("Connection Params:", connectionParams);

    const installNodeCmd =
      "DEBIAN_FRONTEND=noninteractive curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs";

    // Delay for 15 seconds to allow the EC2 instance to be fully provisioned
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Run a command on the EC2 instance to install Node.js
    await runCommandOnEC2(connectionParams, installNodeCmd);

    // spinner.text("Copying project files to the EC2 instance");
    spinner.succeed(
      ui.colorSuccess(
        `EC2 instance provisioned successfully in ${answers.region}`
      )
    );

    // Copy the project directory to the EC2 instance
    spinner.text = "Copying project files to the EC2 instance";
  } catch (err) {
    console.error("Error copying example project directory:", err);
    spinner.fail(ui.colorError("Project deployment failed"));
  }
};

export default deploy;
