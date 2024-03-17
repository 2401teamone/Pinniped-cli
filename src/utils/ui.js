import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";

//COLORS
const SPINNER_COLOR = "magenta";
const STANDARD = "cyanBright";
const SUCCESS = "greenBright";
const ERROR = "redBright";
const BOX_COLOR = "blue";

//LOGGING FUNCTIONS
export const print = (message) => {
  console.log(message);
};

export const colorStandard = (message) => chalk[STANDARD](message);
export const colorSuccess = (message) => chalk[SUCCESS](message);
export const colorError = (message) => chalk[ERROR](message);

export const runSpinner = (message) => {
  return ora({
    text: message,
    color: SPINNER_COLOR,
  }).start();
};

export const boxMsg = (message) => {
  console.log(chalk[BOX_COLOR](boxen(colorStandard(message), { padding: 1 })));
};

//UI FUNCTIONS
export const getStarted = (answers) => {
  const steps = [
    `Welcome to your new project: ${answers.projectName}`,
    "-------------------------------------------",
    "To get starded, run the following commands:",
    "-------------------------------------------",
    `1. cd ${answers.projectName}`,
    "2. npm install",
    "3. npm start",
    "-------------------------------------------",
    "For extension and deployement options, run:",
    "-------------------------------------------",
    "pinniped --help",
  ];

  boxMsg(steps.join("\n"));
};

const welcome = (answers) => {
  console.log(
    boxen(
      chalk.greenBright(
        `Welcome to your new Pinniped project: ${answers.projectName}`
      ),
      { padding: 1 }
    )
  );
};

export const info = () => {
  const message = [
    "Pinniped is a lightweight, extendable backend for conveniently creating and deploying projects",
    "use `pinniped create` to create a new project",
    "use `pinniped deploy` to deploy a project to an AWS EC2 instance",
  ];

  boxMsg(message.join("\n"));
};

export default {
  colorError,
  colorSuccess,
  colorStandard,
  print,
  runSpinner,
  boxMsg,
  getStarted,
  info,
  welcome,
};
