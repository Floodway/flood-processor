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
    .version(require("../../package.json")["version"])
    .command("init","create a new Floodway project")
    .command("generate-json","generate documentation")
    .command("generate-action","generate a new action in a namespace")
    .command("generate-namespace","generate a new namespace")
    .command("dev","start a development server")
    .command("serve-json","serve json")
    .command("generate-java","generate java files")
    .parse(process.argv);