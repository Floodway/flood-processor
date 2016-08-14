#!/usr/bin/env node
"use strict";
var program = require("commander");
var findMain_1 = require("./findMain");
var generate_json_1 = require("./generate-json");
program
    .option("-s", "--save", "Save to file")
    .parse(process.argv);
var _a = findMain_1.default(), main = _a.main, packageJson = _a.packageJson;
console.log(generate_json_1.default(main, packageJson, true));
