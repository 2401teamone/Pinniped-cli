import chalk from "chalk";
import boxen from "boxen";

/*
  Example usage:
  presto greet --name John --message "Your fridge is running." --color "cyan"

  Command with flags and options

    // .command({
  //   command: "greet", // the command name
  //   describe: "Greet a user with a custom message",
  //   builder: {
  //     name: {
  //       describe: "The name of the user",
  //       demandOption: true, // Make the name option required
  //       type: "string",
  //     },
  //     message: {
  //       describe: "The custom message to greet the user with",
  //       type: "string",
  //       default: "Hello", // Set a default message if none is provided
  //     },
  //     color: {
  //       describe: "The color of the message (red, green, blue, yellow)",
  //       type: "string",
  //       default: "green",
  //     },
  //   },
  //   handler: greet,
  // })
*/
const greet = (argv) => {
  // Check if the specified color is a valid method provided by chalk
  if (!chalk[argv.color]) {
    console.error(`Invalid color: ${argv.color}`);
    return;
  }

  const greeting = `Greetings, ${argv.name}!`;
  const styledMessage = chalk[argv.color](greeting + "\n" + argv.message);

  // Create a styled box with the greeting message
  const boxedGreeting = boxen(styledMessage, { padding: 1 });

  // Output the styled greeting
  console.log(boxedGreeting);
};

export default greet;
