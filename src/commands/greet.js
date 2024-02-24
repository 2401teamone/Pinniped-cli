import chalk from "chalk";
import boxen from "boxen";

/*
  Example usage:
  presto greet --name John --message "Your fridge is running." --color "cyan"
*/
const greetHandler = (argv) => {
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

export default greetHandler;
