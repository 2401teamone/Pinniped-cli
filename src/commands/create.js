import inquirer from "inquirer";
import ui from "../utils/ui.js";
import copyTemplate from "../utils/copyTemplate.js";

const create = async (argv) => {
  //prompt the user for the project name
  const answers = await inquirer.prompt([
    {
      message: "Enter project name: ",
      name: "projectName",
      type: "string",
    },
  ]);

  //start a loading spinner
  const spinner = ui.runSpinner(
    ui.colorStandard(`Creating project: ${answers.projectName}...`)
  );

  try {
    //copy the template to the new project directory
    copyTemplate("core-backend", answers.projectName);
    spinner.succeed(ui.colorSuccess("Project created!"));

    //display the get started message
    ui.getStarted(answers);
  } catch (err) {
    console.error("Error copying example project directory:", err);
    spinner.fail(ui.colorError("Project creation failed"));
  }
};

export default create;
