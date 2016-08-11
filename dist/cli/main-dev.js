#!/usr/bin/env node
"use strict";
var program = require("commander");
var findMain_1 = require("./findMain");
program
    .parse(process.argv);
var main = findMain_1.default();
if (main != null) {
    main.start();
}
