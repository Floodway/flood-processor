#!/usr/bin/env node
"use strict";
var program = require("commander");
var inquirer = require("inquirer");
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
program
    .parse(process.argv);
console.log(chalk.blue("Generating a new namespace"));
function findRoot() {
    var currentPath = process.cwd();
    while (true) {
        if (fs.existsSync(path.join(currentPath, "./package.json"))) {
            return currentPath;
        }
        else {
            currentPath = path.join(currentPath, "../");
        }
    }
}
;
function makeClassName(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
var rootDir = path.join(findRoot(), "src");
if (!fs.existsSync(path.join(rootDir, "namespaces"))) {
    console.error(chalk.red("Could not find namespaces folder."));
    process.exit(0);
}
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}
var namespaces = getDirectories(path.join(rootDir, "namespaces"));
function isString(input) {
    return input.substr !== undefined;
}
inquirer.prompt({
    type: "input",
    name: "namespaceName",
    message: "Enter name:",
    validate: function (value) {
        if (namespaces.indexOf(makeClassName(value)) == -1) {
            return true;
        }
        else {
            return "Namespace already exists.";
        }
    }
}).then(function (answers) {
    var namespaceName = answers['namespaceName'];
    if (isString(namespaceName)) {
        var newDir = path.join(rootDir, "namespaces", namespaceName);
        fs.mkdirSync(newDir);
        fs.mkdirSync(path.join(newDir, "actions"));
        fs.mkdirSync(path.join(newDir, "middleware"));
        var file = "\nimport { Namespace } from \"floodway\";\n\nexport default class " + makeClassName(namespaceName) + " extends Namespace{\n    \n    constructor(){\n        super();\n        //Add actions here. Keep the INSERT comment to allow automatic adding using flood generate-action\n        //INSERT\n    }\n    getName(){\n        return \"" + namespaceName + "\";\n    }\n}\n";
        fs.writeFileSync(path.join(newDir, "namespace.ts"), file);
    }
});
