#!/usr/bin/env node
"use strict";
var program = require("commander");
program
    .version(require("../../package.json")["version"])
    .command("init", "create a new Floodway project")
    .command("generate-json", "generate documentation")
    .command("generate-action", "generate a new action in a namespace")
    .command("generate-namespace", "generate a new namespace")
    .command("dev", "start a development server")
    .command("serve-json", "serve json")
    .command("generate-java", "generate java files")
    .parse(process.argv);
