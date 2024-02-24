import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

const create = async (argv) => {
  //prompt the user for the project name and their favorite color
  const answers = await inquirer.prompt([
    {
      message: "Enter project name: ",
      name: "projectName",
      type: "string",
    },
    {
      message: "Aaaand what is your favorite color?",
      name: "favColor",
      type: "string",
    },
  ]);

  //start a loading spinner
  const spinner = ora(
    chalk[answers.favColor](`Creating project: ${answers.projectName}...`)
  ).start();

  //add a 2 second delay to simiulate a more complex process
  await new Promise((resolve) => setTimeout(resolve, 2000));

  //get the directory of the current file
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  //get path to the template directory
  const templateDir = path.join(__dirname, "../templates/core-backend");

  try {
    //copy the template directory to the current working directory and give it the project name
    fs.copySync(templateDir, path.join(process.cwd(), answers.projectName));

    //stop the loading spinner and display a success message
    spinner.succeed(chalk[answers.favColor]("Project created!"));
  } catch (err) {
    console.error("Error copying example project directory:", err);
    spinner.fail(chalk.red("Project creation failed"));
  }
};

export default create;
