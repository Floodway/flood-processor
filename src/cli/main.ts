#!/usr/bin/env node
/*
* Flood CLI
* This CLI is used to setup, maintain, generate and develop floodway applications.
* Included commands
*   flood
*       init <project-name>
 *      generate (namespace|action|docs)  [name] // Using namespace:action notation for action names
 *      dev // Start the application in development mode using a single instance cluster
 *      publish // Upload the application to a machine listening in production mode
 *      setup-production // Starts a flood-production server listening for cluster control parameters.
 *      run-production  // Starts a single instance cluster without flood-production server.
 *
* */
import * as program from "commander";

program
    .version("0,0,1")
    .command("init <name>","create a new Floodway project")
    .command("generate-json","generate documentation")
    .command("dev","start a development server")
    .command("serve-json","serve json")

program.parse(process.argv);