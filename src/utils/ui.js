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

//DEPLOYMENT OPTIONS
export const regions = [
  { name: "us-east-1", value: "us-east-1" },
  { name: "us-east-2", value: "us-east-2" },
  { name: "us-west-1", value: "us-west-1" },
  { name: "us-west-2", value: "us-west-2" },
  { name: "af-south-1", value: "af-south-1" },
  { name: "ap-east-1", value: "ap-east-1" },
  { name: "ap-south-1", value: "ap-south-1" },
  { name: "ap-northeast-2", value: "ap-northeast-2" },
  { name: "ap-southeast-1", value: "ap-southeast-1" },
  { name: "ap-southeast-2", value: "ap-southeast-2" },
  { name: "ap-northeast-1", value: "ap-northeast-1" },
  { name: "ca-central-1", value: "ca-central-1" },
  { name: "eu-central-1", value: "eu-central-1" },
  { name: "eu-west-1", value: "eu-west-1" },
  { name: "eu-west-2", value: "eu-west-2" },
  { name: "eu-west-3", value: "eu-west-3" },
  { name: "eu-north-1", value: "eu-north-1" },
  { name: "me-south-1", value: "me-south-1" },
  { name: "sa-east-1", value: "sa-east-1" },
];

export const instanceTypes = [
  { name: "t4g.nano", value: "t4g.nano" },
  { name: "t4g.micro", value: "t4g.micro" },
  { name: "t4g.small", value: "t4g.small" },
  { name: "t4g.medium", value: "t4g.medium" },
  { name: "t4g.large", value: "t4g.large" },
  { name: "t4g.xlarge", value: "t4g.xlarge" },
  { name: "t4g.2xlarge", value: "t4g.2xlarge" },
];

export const updateOptions = [
  {
    type: "all",
    value: 0,
    name: "All\n - Update the backend, frontend, dependencies, database, and migrations to match your local project\n",
  },
  {
    type: "frontend",
    value: 1,
    name: "Frontend\n - Update the frontend to match your local project's dist folder\n",
  },
  {
    type: "backend",
    value: 2,
    name: "Backend\n - Update the all non-database, non frontend files to match your local project, and update dependencies\n",
  },
  {
    type: "schema",
    value: 3,
    name: "Schema\n - Update the database schema to match the migrations in your local pnpd_data/migrations folder\n",
  },
  {
    type: "database",
    value: 4,
    name: "Database\n - Update the pnpd.db file to match your local pnpd.db file, and update schema migrations\n",
  },
];

//LOGGING FUNCTIONS
export const print = (message) => {
  console.log(colorStandard(message));
};

export const commandHeader = (message) => {
  console.clear();
  console.log(colorStandard(message));
  divider(80);
};
export const printSuccess = (message) => {
  console.log(colorSuccess(message));
};
export const printError = (message) => {
  console.log(colorError(message));
};

export const divider = (length = 80, newLine) => {
  let div = colorStandard("-".repeat(length));
  if (newLine) div += "\n";
  console.log(div);
};

export const space = (lines = 1) => {
  console.log("\n".repeat(lines));
};

//COLOR FUNCTIONS

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
    `Welcome to your new pinniped project: ${answers.projectName}`,
    "-------------------------------------------",
    "To get started, run the following commands:",
    "-------------------------------------------",
    `1. cd ${answers.projectName}`,
    "2. npm install",
    "3. npm start\n",
    "Please run `pinniped info` deployment options and other commands.",
  ];

  print(steps.join("\n"));
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

  print(fullLogo100);
  boxMsg(message.join("\n"));
};

export default {
  space,
  colorStandard,
  colorSuccess,
  colorError,
  commandHeader,
  divider,
  colorStandard,
  updateOptions,
  regions,
  instanceTypes,
  print,
  printSuccess,
  printError,
  runSpinner,
  boxMsg,
  getStarted,
  info,
  welcome,
};
