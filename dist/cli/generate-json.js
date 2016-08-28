#!/usr/bin/env node
"use strict";
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
var Utils = require("./utils");
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
var rootDir = findRoot();
console.log(chalk.red("Generating the documentation only works if the Project follows the Flood design specs!"));
var main = require(require(path.join(rootDir, "./package.json")["main"]));
var result;
if (main != null) {
    result = {
        version: packageJson.version,
        connectors: main.getConnectors().map(function (item) { return item.getMeta(); }),
    };
    var namespaces = Utils.getDirectories(path.join(rootDir, "./src/namespaces"));
    console.log(chalk.green("Found " + namespaces.length + " namespaces!"));
    for (var _i = 0, namespaces_1 = namespaces; _i < namespaces_1.length; _i++) {
        var namespaceDir = namespaces_1[_i];
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (main, packageJson, writeToFile) {
    if (writeToFile === void 0) { writeToFile = false; }
    if (main != null) {
        if (main.getNamespaces != null) {
            var namespaces = main.getNamespaces();
            var namespaceResult = [];
            for (var _i = 0, _a = Object.keys(namespaces); _i < _a.length; _i++) {
                var namespaceName = _a[_i];
                var namespace = namespaces[namespaceName];
                var actions = [];
                for (var _b = 0, _c = Object.keys(namespace.getActions()); _b < _c.length; _b++) {
                    var key = _c[_b];
                    var actionI = namespace.getActions()[key];
                    var action = new actionI();
                    action.setNamespace(namespace);
                    actions.push(action.toJson());
                    console.log(action.toJson().params);
                }
                namespaceResult.push({
                    name: namespace.getName(),
                    actions: actions,
                });
            }
            var result_1 = {
                namespaces: namespaceResult,
            };
            if (writeToFile == true) {
                fs.writeFileSync(path.join(process.cwd(), "./config.json"), JSON.stringify(result_1));
            }
            return JSON.stringify(result_1);
        }
    }
};
