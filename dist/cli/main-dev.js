#!/usr/bin/env node
"use strict";
var program = require("commander");
var findMain_1 = require("./findMain");
program
    .parse(process.argv);
var files = findMain_1.default();
if (files.main != null) {
    files.main.start();
}
