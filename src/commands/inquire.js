import inquirer from "inquirer";
// Get input from user with inquirer
const inquire = async () => {
  const answers = await inquirer.prompt([
    {
      message: "What is your name?",
      name: "name",
      type: "string",
    },
  ]);

  console.log(`Hello, ${answers.name}!`);
};

export default inquire;
