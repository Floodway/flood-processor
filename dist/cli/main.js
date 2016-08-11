#!/usr/bin/env node
"use strict";
var program = require("commander");
program
    .version("0,0,1")
    .command("init <name>", "create a new Floodway project")
    .command("generate-json", "generate documentation")
    .command("dev", "start a development server")
    .command("serve-json", "serve json")
    .command("generate-java", "generate java files");
program.parse(process.argv);
