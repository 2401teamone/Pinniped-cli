###Setup###

- Clone the repository
- cd into the Pinniped-cli directory
- run `npm install`
- run `npm install -g` to install Pinniped-cli globally
- navigate to a directory where you'd like to create a new Pinniped project
- run `pinniped create` and follow the promps.

_Commands_

- pinniped

  - Shows a welcome, and available commands and options
    - Currently just shows commands

- pinniped create

  - Takes you through a guided new project creation process that demo's creates
    the base backend project in your current directory
  - Asks for a project name
  - Copies the `core-backend` directory from the `templates` directory into your
    current working directory
  - Displays instructions for next steps - not yet implemented
    - cd into your new directory
    - run npm install
    - run npm start

- pinniped info

  - Displays info about the pinniped

- pinniped deploy
  - Takes you through a guided deployement process (Doesn't actually deploy anything at this stage)

_Dependencies_

- Yargs

  - https://github.com/yargs/yargs/blob/0c95f9c79e1810cf9c8964fbf7d139009412f7e7/docs/api.md

- inguirer

- fs-extra

  - https://www.npmjs.com/package/fs-extra

- Ora - Command line spinner
  - https://www.npmjs.com/package/ora
