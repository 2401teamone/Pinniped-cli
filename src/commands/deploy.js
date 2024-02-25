import fs from "fs-extra";
import inquirer from "inquirer";
import ui from "../utils/ui.js";

const deploy = async (argv) => {
  // Get list of directories in the current working directory
  const directories = fs
    .readdirSync(process.cwd(), { withFileTypes: true })
    .filter((dirEntity) => dirEntity.isDirectory())
    .map((directory) => directory.name);

  // Prompt the user to select a project directory
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "projectName",
      message: "Select a project to deploy:",
      choices: directories,
    },
  ]);

  console.log(answers);

  //start a loading spinner
  const spinner = ui.runSpinner(
    ui.colorStandard(`Deploying Project: ${answers.projectName}...`)
  );

  try {
    //Deploy the project...somehow

    //add a 2 second delay to simiulate a more complex process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    spinner.succeed(ui.colorSuccess("Project deployed!"));
  } catch (err) {
    console.error("Error copying example project directory:", err);
    spinner.fail(ui.colorError("Project deployment failed"));
  }
};

export default deploy;
