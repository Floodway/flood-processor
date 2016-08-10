#!/usr/bin/env node
"use strict";
var program = require("commander");
var path = require("path");
var generate_json_1 = require("./generate-json");
program
    .option("-s", "--save", "Save to file")
    .parse(process.argv);
var packageJsonPath = path.join(process.cwd(), "./package.json");
var packageJson;
try {
    packageJson = require(packageJsonPath);
}
catch (e) {
    console.error("Could not open package.json file. Make sure you are at root level of your project", e);
    process.exit(1);
}
var sourcePath;
if (packageJson != null) {
    sourcePath = path.join(process.cwd(), packageJson.main);
}
var main;
try {
    main = require(sourcePath);
}
catch (e) {
    console.error("Could not open the main floodway file. Make sure it exsits.", e);
    process.exit(1);
}
console.log(generate_json_1.default(main, packageJson, true));
