import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import { fullLogo100 } from "./logo.js";

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
    "To get started, run the following commands:",
    "-------------------------------------------",
    `1. cd ${answers.projectName}`,
    "2. npm install",
    "3. npm start",
    "-------------------------------------------",
    "For extension and deployment options, run:",
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
    "Pinniped is a lightweight, extendable backend for conveniently creating and deploying projects.",
    "\n",
    "----------- Pinniped CLI Commands ------------",
    "Run `pinniped create` to create a new project.",
    "Run `pinniped deploy` to deploy a project to an AWS EC2 instance.",
    "\n",
    "------- Development and Build Commands -------",

    "Run `npm start` to run the backend.",
    "Run `npm run dev` to run the backend with nodemon enabled for ease of development.",
    "Run `npm build` inside your project directory to minify your server into the `dist` folder.",
    "Run `npm run prod` to run your built server from the `dist` folder.",
    "\n",
    "------------- Database Commands --------------",
    "Run `npm reset-all` to reset the main database, sessions, and migrations.",
    "Run `npm reset-db` to reset the main database.",
    "Run `npm reset-sessions` to reset the sessions database.",
    "Run `npm reset-migrations` to reset the migrations database.",
  ];

  console.log(colorStandard(fullLogo100));
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
