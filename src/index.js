import yargs from "yargs";
import chalk from "chalk";

import info from "./commands/info.js";
import create from "./commands/create.js";
import provision from "./commands/provision.js";
import deploy from "./commands/deploy.js";
import start from "./commands/start.js";
import stop from "./commands/stop.js";
import update from "./commands/update.js";
import test from "./commands/test.js";

// Define the CLI command with flags and options
yargs(process.argv.slice(2))
  .command("info", "Display information about the CLI", () => {}, info)
  .command("create", "Create a new extendable backend app", () => {}, create)
  .command(
    "provision",
    "Provision a new AWS EC2 Instance for your app",
    () => {},
    provision
  )
  .command("deploy", "Deploy your app to an AWS EC2 Instance", () => {}, deploy)
  .command("start", "Start your app on an AWS EC2 Instance", () => {}, start)
  .command("stop", "Stop your app on an AWS EC2 Instance", () => {}, stop)
  .command("update", "Update app on an AWS EC2 Instance", () => {}, update)
  .command("test", "test app on an AWS EC2 Instance", () => {}, test)
  .strict()
  .demandCommand(
    1,
    1,
    chalk.cyanBright("Choose a command: create, deploy, or info,\n")
  )
  .help("h")
  .parse(); // Parse the command-line arguments
