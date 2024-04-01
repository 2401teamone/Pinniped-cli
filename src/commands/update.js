// Purpose: Update the project on the EC2 instance
import inquirer from "inquirer";
import ui from "../utils/ui.js";
import { getInstanceChoices, readEC2MetaData } from "../utils/instanceData.js";
import SSHClient from "../models/sshClient.js";
const COMMAND_HEADER_MSG = "Pinniped Update";

const update = async () => {
  const EC2MetaData = await readEC2MetaData();
  const instanceChoices = await getInstanceChoices();

  ui.commandHeader(COMMAND_HEADER_MSG);

  let answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message:
        "This command will: \n" +
        "  1. Stop your app running on your EC2 instance if it is running. \n" +
        "  2. Update files on your EC2 instance to match your local project directory. \n" +
        "  3. Re-start your app.  \n\n" +
        "     Would you like to proceed?",
    },
  ]);

  if (!answers.proceed) {
    console.log(
      "\n  Update command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }

  ui.commandHeader(COMMAND_HEADER_MSG);
  answers = await inquirer.prompt([
    {
      type: "list",
      name: "instance",
      message: "Select the EC2 instance to update: \n\n",
      choices: instanceChoices,
    },
    {
      type: "list",
      name: "type",
      message: "Select your update type: \n",
      choices: ui.updateOptions,
      pageSize: 20,
    },
  ]);

  const finalCheck = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: `Warning! This action will overwrite files on your EC2 instance at ${
        EC2MetaData[answers.instance].publicIpAddress
      } with your local files. \n\n  Proceed?`,
    },
  ]);

  if (!finalCheck.proceed) {
    console.log(
      "\n  Update command cancelled. \n  Please run `pinniped info` help using this cli.\n"
    );
    return;
  }

  const type = ui.updateOptions[answers.type].type;
  ui.commandHeader(COMMAND_HEADER_MSG + ` - Type: ${type}`);

  //start a loading spinner
  const spinner = ui.runSpinner(
    ui.colorStandard(
      `Connecting to AWS EC2 instance. This may take a few seconds...`
    )
  );

  try {
    const sshClient = new SSHClient(EC2MetaData[answers.instance], spinner);

    await sshClient.connect();
    await sshClient.runCommand("stop");

    let localDirPath;
    let remoteDirPath;

    switch (type) {
      case "full":
        localDirPath = process.cwd();
        remoteDirPath = "/home/ubuntu/server";
        await sshClient.syncFiles(localDirPath, remoteDirPath, type);
        await sshClient.runCommand("updateDependencies");
        break;
      case "frontend":
        localDirPath = process.cwd() + "/dist";
        remoteDirPath = "/home/ubuntu/server/dist";
        await sshClient.syncFiles(localDirPath, remoteDirPath, type);
        break;
      case "backend":
        localDirPath = process.cwd();
        remoteDirPath = "/home/ubuntu/server";
        await sshClient.syncFiles(localDirPath, remoteDirPath, type);
        await sshClient.runCommand("updateDependencies");
        break;
      case "schema":
        localDirPath = process.cwd() + "/pnpd_data/migrations";
        remoteDirPath = "/home/ubuntu/server/pnpd_data/migrations";
        await sshClient.syncFiles(localDirPath, remoteDirPath, type);
        break;
      case "database":
        // Replace the pnpd.db file on the EC2 instance with the local pnpd.db file
        localDirPath = process.cwd() + "/pnpd_data/pnpd.db";
        remoteDirPath = "/home/ubuntu/server/pnpd_data/pnpd.db";
        await sshClient.sendFile(localDirPath, remoteDirPath);

        // Replace the migrations folder on the EC2 instance with the local migrations folder
        localDirPath = process.cwd() + "/pnpd_data/migrations";
        remoteDirPath = "/home/ubuntu/server/pnpd_data/migrations";
        await sshClient.syncFiles(localDirPath, remoteDirPath, "schema");
        break;
    }

    await sshClient.runCommand("restart");
    sshClient.closeConnection();

    spinner.succeed(ui.colorSuccess("Project Updated Successfully!"));

    ui.space();
  } catch (err) {
    spinner.fail(ui.colorError("Error updating project"));
    console.log(err);
  }
};

export default update;
