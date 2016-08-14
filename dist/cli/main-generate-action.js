#!/usr/bin/env node
"use strict";
var program = require("commander");
var inquirer = require("inquirer");
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
program
    .parse(process.argv);
console.log(chalk.blue("Generating a new action"));
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
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}
if (!fs.existsSync(path.join(rootDir, "./src/namespaces/"))) {
    console.error(chalk.red("Can not generate a namespace. Project doesn\'t follow folder structure"));
    process.exit(1);
}
var namespacesPath = path.join(rootDir, "./src/namespaces/");
var availableNamespaces = getDirectories(namespacesPath);
if (availableNamespaces.length == 0) {
    console.error("No namespaces in this project yet. Run flood generate-namespace to create one");
    process.exit(1);
}
function getMeta(namespaceName) {
    return inquirer.prompt([{
            type: "input",
            name: "actionName",
            message: "What should the action be called",
            validate: function (value) {
                var re = new RegExp("([a-z]+[A-Z]+[a-z]+)+|[a-z]+");
                if (re.test(value)) {
                    var actionPath = path.join(namespaceDir, "./actions", value + ".js");
                    if (fs.existsSync(actionPath)) {
                        return chalk.red("This action already exists");
                    }
                    else {
                        if (value.toLowerCase() != namespaceName.toLocaleLowerCase()) {
                            return true;
                        }
                        return chalk.red("Can not create an action with the same name as the namespace.");
                    }
                }
                else {
                    return chalk.red("Make sure the action name is camelCased (starting lower-cased!)");
                }
            }
        }, {
            type: "input",
            name: "description",
            message: "Enter a description for this action",
            validate: function (value) {
                if (value.length < 5) {
                    return chalk.red("Please enter a sufficient description");
                }
                else {
                    return true;
                }
            }
        }, {
            type: "confirm",
            name: "supportsUpdates",
            message: "Does the action support updates?",
        }]);
}
function isString(input) {
    return input.substr !== undefined;
}
function getNamespace() {
    return inquirer.prompt({
        type: "list",
        name: "namespace",
        message: "Which namespace would you like to use?",
        choices: availableNamespaces
    });
}
function checkRestPoint() {
    return inquirer.prompt({
        type: "confirm",
        name: "createRest",
        message: "Do you want to create a Rest-Endpoint?"
    });
}
function getRestPointInfo() {
    return inquirer.prompt([{
            type: "input",
            name: "url",
            message: "What URL should the endpoint be located at?"
        }, {
            type: "checkbox",
            name: "methods",
            message: "Select HTTP Verbs",
            choices: [
                { name: "GET", value: "HttpMethod.GET" },
                { name: "POST", value: "HttpMethod.POST" },
                { name: "PATCH", value: "HttpMethod.PATCH" },
                { name: "DELETE", value: "HttpMethod.DELETE" },
            ]
        }]);
}
function makeClassName(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
function generate(namespace, action, description, supportsUpdates, createRestpoint, url, methods) {
    var filePath = path.join(namespacesPath, namespace, "./actions/", action + ".ts");
    console.log(filePath);
    var webConfig;
    if (createRestpoint) {
        webConfig = "\n    getWebConfig(){\n        return {\n            url: \"" + url + "\",\n            methods: [" + methods.join(",") + "]\n        }\n    }\n";
    }
    else {
        webConfig = "";
    }
    var file = "// Import dependencies\nimport { Action, ObjectSchema " + (createRestpoint ? ", WebAction , HttpMethod" : "") + " } from \"floodway\";\n\nexport default class " + makeClassName(action) + "Action extends Action " + (createRestpoint ? "implements WebAction" : "") + "{\n    \n" + webConfig + "\n    \n    getMetaData(){\n        return{\n            name: \"" + action + "\",\n            description: \"" + description + "\",\n            supportsUpdates: " + supportsUpdates + ",\n            params: new ObjectSchema().children({\n            \n            }),\n            result: new ObjectSchema().children({\n                \n            }),\n            middleware: [],\n            errors: []\n        }\n    }\n    \n    run(){\n       \n    }\n    \n}\n";
    fs.writeFileSync(filePath, file);
    var namespaceTs = fs.readFileSync(path.join(namespaceDir, "namespace.ts")).toString();
    if (namespaceTs.indexOf("//INSERT") != -1) {
        namespaceTs = namespaceTs.replace("//INSERT", "this.action(" + makeClassName(action) + "Action);\n        //INSERT\n");
        var splits = namespaceTs.split("\n");
        splits.unshift("import " + makeClassName(action) + "Action from \"./actions/" + makeClassName(action) + "\";");
        fs.writeFileSync(path.join(namespaceDir, "namespace.ts"), splits.join("\n"));
    }
    else {
        console.log(chalk.red("Could not automatically add action to namespace. Missing //INSERT comment!"));
    }
}
var namespaceDir;
getNamespace()
    .then(function (nsInfo) {
    var namespace = nsInfo.namespace;
    if (isString(namespace)) {
        namespaceDir = path.join(namespacesPath, namespace);
        getMeta(namespace).then(function (meta) {
            var actionName = meta.actionName, description = meta.description, supportsUpdates = meta.supportsUpdates;
            if (!supportsUpdates) {
                checkRestPoint().then(function (checkRestResult) {
                    if (checkRestResult["createRest"]) {
                        getRestPointInfo().then(function (restPointInfo) {
                            var url = restPointInfo.url, methods = restPointInfo.methods;
                            generate(namespace, actionName, description, supportsUpdates, true, url, methods);
                        });
                    }
                    else {
                        generate(namespace, actionName, description, supportsUpdates, false, null, null);
                    }
                });
            }
            else {
                generate(namespace, actionName, description, supportsUpdates, false, null, null);
            }
        });
    }
});
