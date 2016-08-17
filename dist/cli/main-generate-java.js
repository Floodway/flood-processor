#!/usr/bin/env node
"use strict";
var program = require("commander");
var inquirer = require("inquirer");
var fs = require("fs");
var chalk = require("chalk");
var path = require("path");
var findMain_1 = require("./findMain");
program
    .parse(process.argv);
var files = findMain_1.default();
var main = files.main;
function isObjectSchema(input) {
    return input.getClassName !== undefined;
}
function isNumberSchema(input) {
    return input.allowsDecimals !== undefined;
}
function isArraySchema(input) {
    return input.getChildSchema !== undefined;
}
function makeClassName(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
var outDir;
if (files.packageJson.javaOut == null) {
    outDir = path.join(process.cwd(), "./java");
}
else {
    outDir = files.packageJson.javaOut;
}
var javaPackage = "";
if (files.packageJson.javaPackage != null) {
    javaPackage = "package " + files.packageJson.javaPackage + ";";
}
function getType(schema) {
    if (isObjectSchema(schema)) {
        return schema.getClassName();
    }
    else {
        var json = schema.toJSON();
        switch (json.type) {
            case "number":
                return json.allowsDecimals ? "float" : "long";
            case "string":
                return "String";
            case "array":
                if (isArraySchema(schema)) {
                    return "List<" + getType(schema.getChildSchema()) + ">";
                }
                break;
            case "boolean":
                return "boolean";
        }
    }
}
function generateSchemas(namespace) {
    console.log(chalk.green("→  Generating namespace: " + namespace.getName()));
    var result = "";
    var generatedObjects = {};
    Object.keys(namespace.actions).map(function (actionName) {
        var actionI = namespace.actions[actionName];
        var action = new actionI();
        function convertSchema(schemaI) {
            var setters = 0;
            if (isObjectSchema(schemaI)) {
                if (schemaI.getClassName().indexOf(".") == -1 && !generatedObjects.hasOwnProperty(schemaI.getClassName())) {
                    var result_1 = "    public static class " + schemaI.getClassName() + "{";
                    Object.keys(schemaI.getChildren()).map(function (key) {
                        var childSchema = schemaI.getChild(key);
                        if (isObjectSchema(childSchema)) {
                            convertSchema(childSchema);
                        }
                        if (isArraySchema(childSchema)) {
                            convertSchema(childSchema.getChildSchema());
                        }
                        result_1 += "public " + getType(childSchema) + " " + key + ";";
                    });
                    Object.keys(schemaI.getChildren()).map(function (key) {
                        var childSchema = schemaI.getChild(key);
                        result_1 += "public void set" + makeClassName(key) + "(" + getType(childSchema) + " " + key + "){this." + key + " = " + key + "; }";
                        result_1 += "public " + getType(childSchema) + " get" + makeClassName(key) + "(){ return this." + key + "; }";
                        setters++;
                    });
                    result_1 += "}";
                    generatedObjects[schemaI.getClassName()] = result_1;
                    console.log(chalk.green("\t ✓ Generated Class: " + schemaI.getClassName()));
                    console.log(chalk.green("\t \t ✓ Generated " + setters + " Setters/Getters"));
                }
            }
        }
        if (action.getMetaData().exposeParams != null) {
            convertSchema(action.getMetaData().exposeParams);
        }
        else {
            convertSchema(action.getMetaData().params);
        }
        convertSchema(action.getMetaData().result);
    });
    var final = "";
    Object.keys(generatedObjects).map(function (key) {
        final += "\n" + generatedObjects[key];
    });
    return final;
}
function generateFunctions(namespace) {
    var result = "";
    Object.keys(namespace.getActions()).map(function (actionName) {
        var actionI = namespace.getAction(actionName);
        var action = new actionI;
        var name = action.getMetaData().name;
        var resultClass = getType(action.getMetaData().result);
        var paramsClass;
        if (action.getMetaData().exposeParams != null) {
            paramsClass = getType(action.getMetaData().exposeParams);
        }
        else {
            paramsClass = getType(action.getMetaData().params);
        }
        result += "\n    public abstract static class " + makeClassName(name) + "Callback{\n        public abstract void result(" + resultClass + " result);\n        public abstract void err(String errorCode,String description);\n    }\n    \n    public static Request " + name + "(" + paramsClass + " params,final " + makeClassName(name) + "Callback callback){\n        return new Request(\"" + namespace.getName() + "\",\"" + name + "\",params,new Request.RequestCallback(" + resultClass + ".class){\n            @Override\n            public void res(Object result){\n                callback.result((" + resultClass + ") result);\n            }\n            @Override\n            public void err(String ec,String desc){\n                callback.err(ec,desc);\n            }\n        });\n    }\n        ";
    });
    return result;
}
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}
inquirer.prompt({
    type: "checkbox",
    name: "namespaces",
    message: "Select namespaces",
    choices: Object.keys(main.getNamespaces()).map(function (key) {
        return {
            name: key,
            value: key,
            checked: true
        };
    })
}).then(function (answer) {
    generateFiles(answer["namespaces"]);
});
function generateFiles(namespaces) {
    namespaces.map(function (name) {
        var namespace = main.getNamespace(name);
        var schemas = generateSchemas(namespace);
        var functions = generateFunctions(namespace);
        var file = "\n" + javaPackage + "\nimport java.util.List;\n/*\n* This class was automatically generated by Floodway.\n*/\npublic class " + makeClassName(namespace.getName()) + "{\n    " + schemas + "\n    " + functions + "\n}\n    ";
        fs.writeFileSync(path.join(outDir, makeClassName(namespace.getName()) + ".java"), file);
    });
}
