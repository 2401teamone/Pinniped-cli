import yargs from "yargs";
import chalk from "chalk";

import sing from "./commands/sing.js";
import inquire from "./commands/inquire.js";
import create from "./commands/create.js";
import greet from "./commands/greet.js";

// Define the CLI command with flags and options
yargs(process.argv.slice(2))
  .command("create", "Create a new project", () => {}, create)
  .command({
    command: "greet", // the command name
    describe: "Greet a user with a custom message",
    builder: {
      name: {
        describe: "The name of the user",
        demandOption: true, // Make the name option required
        type: "string",
      },
      message: {
        describe: "The custom message to greet the user with",
        type: "string",
        default: "Hello", // Set a default message if none is provided
      },
      color: {
        describe: "The color of the message (red, green, blue, yellow)",
        type: "string",
        default: "green",
      },
    },
    handler: greet,
  })
  .command("ask", "Use inquirer to prompt for your name", () => {}, inquire)
  .command("sing", "A classic yargs command without prompting", () => {}, sing)
  .strict()
  .demandCommand(
    1,
    1,
    chalk.cyanBright("Choose a command: create, ask, greet, or sing \n")
  )
  .help("h")
  .parse(); // Parse the command-line arguments
