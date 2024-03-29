import inquirer from "inquirer";
import ui from "../utils/ui.js";
import copyTemplate from "../utils/copyTemplate.js";
const COMMAND_HEADER_MSG = "Pinniped Create";

const create = async (argv) => {
  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will initialize a new pinniped project directory in your\n" +
        "  current working directory.\n\n" +
        "  Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Create command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }

  //prompt the user for the project name
  answers = await inquirer.prompt([
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
    ui.space();
    ui.getStarted(answers);
    ui.space();
  } catch (err) {
    console.error("Error copying example project directory:", err);
    spinner.fail(ui.colorError("Project creation failed"));
  }
};

export default create;
