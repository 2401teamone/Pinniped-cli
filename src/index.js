import yargs from "yargs";
import chalk from "chalk";

import info from "./commands/info.js";
import create from "./commands/create.js";
import deploy from "./commands/deploy.js";

// Define the CLI command with flags and options
yargs(process.argv.slice(2))
  .command("info", "Display information about the CLI", () => {}, info)
  .command("create", "Create a new project", () => {}, create)
  .command(
    "deploy",
    "Deploy a project to an AWS EC2 Instance",
    () => {},
    deploy
  )
  .strict()
  .demandCommand(
    1,
    1,
    chalk.cyanBright("Choose a command: create, deploy, or info,\n")
  )
  .help("h")
  .parse(); // Parse the command-line arguments
