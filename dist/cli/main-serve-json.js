#!/usr/bin/env node
"use strict";
var express = require("express");
var program = require("commander");
var path = require("path");
var child_process_1 = require("child_process");
program
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
