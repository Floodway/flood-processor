#!/usr/bin/env node
"use strict";
var program = require("commander");
var inquirer = require("inquirer");
var fs = require("fs");
var path = require("path");
var child_process_1 = require("child_process");
var chalk = require("chalk");
program
    .parse(process.argv);
console.log(chalk.blue("Welcome!\nthis wizard will guide you through the steps in setting up a new Floodway project!"));
function getName() {
    return inquirer.prompt({
        type: "input",
        message: "Enter the name of your new project",
        name: "name",
        validate: function (value) {
            var re = new RegExp("([a-z]|\d|_)+");
            if (re.test(value)) {
                if (fs.existsSync(path.join(process.cwd(), value))) {
                    return chalk.red("There's already a directory at this path");
                }
                else {
                    return true;
                }
            }
            else {
                return chalk.red("Please enter a name that is only one word.");
            }
        }
    });
}
getName().then(function (info) {
    var rootDir = path.join(process.cwd(), info["name"]);
    console.log(chalk.green("Create new directory"));
    fs.mkdirSync(rootDir);
    console.log(chalk.green("Installing dependencies"));
    child_process_1.exec("npm init -y && npm i --save floodway typescript").on("close", function () {
        var indexTs = "\n\n\n";
        var configJson = "\n";
        var tsConfig = "\n\n";
        console.log(chalk.green("Creating default files"));
        fs.mkdirSync(path.join(rootDir, "src"));
        fs.mkdirSync(path.join(rootDir, "src", "namespaces"));
        fs.writeFileSync(path.join(rootDir, "src", "index.ts"), indexTs);
        fs.writeFileSync(path.join(rootDir, "src", "config.json"), configJson);
        fs.writeFileSync(path.join(rootDir, "tsconfig.json"), tsConfig);
    });
});
