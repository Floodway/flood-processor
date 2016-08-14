#!/usr/bin/env node
"use strict";
var express = require("express");
var program = require("commander");
var path = require("path");
var child_process_1 = require("child_process");
var findMain_1 = require("./findMain");
program
    .parse(process.argv);
var _a = findMain_1.default(), main = _a.main, packageJson = _a.packageJson;
setInterval(function () {
    child_process_1.exec("node " + process.argv[1].split("main-serve-json")[0] + "main-generate-json.js", function (error, stdout, stderr) {
        if (error) {
            console.error("exec error: " + error);
            return;
        }
    });
}, 1500);
var app = express();
app.get("/config.json", function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.json(require(path.join(process.cwd(), "./config.json")));
});
app.listen(5763);
