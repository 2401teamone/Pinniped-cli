# Pinniped-CLI

An easy to use CLI tool for creating, managing, and deploying your Pinniped projects.

## Setup

- run `npm install pinniped-cli -g` to install Pinniped-cli globally
- navigate to a directory where you'd like to create a new Pinniped project
- run `pinniped create` and follow the prompts.

## Commands

### Development / Local Project Commands

- `pinniped info`

  - Displays info about the pinniped scripts and commands available for use.

- `pinniped create`

  - Prompts you for your project name and initializes a new Pinniped project in your current working directory.
    
- `npm start`
  
  - Runs your local pinniped project using node.
  
- `npm run dev`
  
  - Runs your local pinniped project using nodemon.
    
- `npm run reset-all`
  
  - Resets your local `pnpd.db` main database file, migrations, sessions, and logs database files. 
    
- `npm run reset-db`
  
  - Resets your local `pnpd.db` main database file.
    
- `npm run reset-sessions`
  
  - Resets your local `sessions.db` file.
 
- `npm run reset-migrations`
  
  - Removes all migration files from your local project and resets the corresponding migrations table entries in the main `pnpd.db` database file

### AWS EC2 Instance Deployment and Application Updates

- `pinniped provision`
  
	- Provisions an AWS EC2 instance.

- `pinniped deploy`
  
	- Deploys your pinniped application to your provisioned EC2 instance and installs your project dependencies.

- `pinniped start`
  
	- Starts your pinniped application on your EC2 instance using the PM2 process manager.

- `pinniped stop`
  
	- Stops your pinniped application on your EC2 instance using the PM2 process manager.

- `pinniped update`
  
	- Updates your pinniped application on your EC2 instance to match your local pinniped application, allowing you to select your update type.
   
      All - Update the backend, frontend, dependencies, database, and migrations to match your local project
 
      Frontend - Update the frontend to match your local project's dist folder
 
      Backend - Update all non-database, non-frontend files to match your local project, and update dependencies
 
      Schema - Update the database schema to match the migrations in your local pnpd_data/migrations folder
 
      Database - Update the pnpd.db file to match your local `pnpd.db` file, and update schema migrations
