#!/usr/bin/env node
"use strict";
var program = require("commander");
var path = require("path");
program
    .parse(process.argv);
var packageJsonPath = path.join(process.cwd(), "package.json");
var packageJson, main, sourcePath;
try {
    packageJson = require(packageJsonPath);
}
catch (e) {
    console.error("Could not open package.json file. Make sure you are at root level of your project", e);
    process.exit(1);
}
if (packageJson != null) {
    sourcePath = path.join(process.cwd(), packageJson.main);
}
try {
    main = require(sourcePath);
}
catch (e) {
    console.error("Could not open the main floodway file. Make sure it exsits.", e);
    process.exit(1);
}
if (main != null) {
    main.start();
}
