#!/usr/bin/env node
"use strict";
var program = require("commander");
var inquirer = require("inquirer");
var fs = require("fs");
var chalk = require("chalk");
var path = require("path");
var __entry_1 = require("../__entry");
var findMain_1 = require("./findMain");
program.parse(process.argv);
var files, main, outDir, javaPackage;
files = findMain_1.default();
main = files.main;
if (files.packageJson.javaOut == null) {
    outDir = path.join(process.cwd(), "./java");
}
else {
    outDir = files.packageJson.javaOut;
}
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}
if (files.packageJson.javaPackage != null) {
    javaPackage = "package " + files.packageJson.javaPackage + ";";
}
else {
    javaPackage = "";
}
function getType(schema) {
    if (__entry_1.ObjectSchema.isObjectSchema(schema)) {
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
                if (__entry_1.ArraySchema.isArraySchema(schema)) {
                    return "List<" + getType(schema.getChildSchema()) + ">";
                }
                break;
            case "boolean":
                return "boolean";
        }
    }
}
function generateSchemas(namespace, generateImmutables) {
    var result = "";
    var generatedObjects = {};
    Object.keys(namespace.actions).map(function (actionName) {
        var actionI = namespace.actions[actionName];
        var action = new actionI();
        function convertSchema(schemaI) {
            var setters = 0;
            var result = "";
            if (__entry_1.ObjectSchema.isObjectSchema(schemaI)) {
                if (schemaI.getClassName().indexOf(".") == -1 && !generatedObjects.hasOwnProperty(schemaI.getClassName())) {
                    if (!generateImmutables) {
                        result += "    public static class " + schemaI.getClassName() + "{";
                        Object.keys(schemaI.getChildren()).map(function (key) {
                            var childSchema = schemaI.getChild(key);
                            if (__entry_1.ObjectSchema.isObjectSchema(childSchema)) {
                                convertSchema(childSchema);
                            }
                            if (__entry_1.ArraySchema.isArraySchema(childSchema)) {
                                convertSchema(childSchema.getChildSchema());
                            }
                            result += "public " + getType(childSchema) + " " + key + ";";
                        });
                        Object.keys(schemaI.getChildren()).map(function (key) {
                            var childSchema = schemaI.getChild(key);
                            result += "public void set" + makeClassName(key) + "(" + getType(childSchema) + " " + key + "){this." + key + " = " + key + "; }";
                            result += "public " + getType(childSchema) + " get" + makeClassName(key) + "(){ return this." + key + "; }";
                            setters++;
                        });
                        result += "}";
                    }
                    else {
                        result += "    @Value.Immutable public static abstract class " + schemaI.getClassName() + "{";
                        Object.keys(schemaI.getChildren()).map(function (key) {
                            var childSchema = schemaI.getChild(key);
                            if (isObjectSchema(childSchema)) {
                                convertSchema(childSchema);
                            }
                            if (isArraySchema(childSchema)) {
                                convertSchema(childSchema.getChildSchema());
                            }
                            result += "public abstract " + getType(childSchema) + " " + key + "();";
                        });
                        result += "}";
                    }
                    generatedObjects[schemaI.getClassName()] = result;
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
        result += convertTemplate(fs.readFileSync(path.join(__dirname, "../../templates/javaClass.template")).toString(), {
            "action": name,
            "namespace": namespace.getName(),
            "className": makeClassName(name),
            "paramsClass": paramsClass,
            "resultClass": resultClass,
        });
    });
    return result;
}
function convertTemplate(template, vars) {
    for (var _i = 0, _a = Object.keys(vars); _i < _a.length; _i++) {
        var key = _a[_i];
        var re = new RegExp("\\${" + key + "}", "g");
        template = template.replace(re, vars[key]);
    }
    return template;
}
var allFiles = ["Api.java", "ApiActivity.java", "ApiFragment.java", "Request.java", "ApiStatusCallback.java", "SsidProvider.java", "BaseUrlProvider.java", "Utils.java"];
var copyFiles = [];
if (files.packageJson["copyFiles"] != null) {
}
inquirer.prompt([{
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
    }]).then(function (answer) {
    generateFiles(answer["namespaces"], answer["generateImmutables"]);
    files.map(function (file) {
        fs.readFile(path.join(__dirname, "../../templates", file), function (err, data) {
            var split = data.toString().split("\n");
            split.unshift(javaPackage);
            fs.writeFile(path.join(outDir, file), split.join("\n"), function (err) {
                console.log(err);
                console.log("Copied file: " + file);
            });
        });
    });
});
function generateFiles(namespaces, generateImmutables) {
    namespaces.map(function (name) {
        var namespace = main.getNamespace(name);
        var schemas = generateSchemas(namespace, generateImmutables);
        var functions = generateFunctions(namespace);
        var imports = generateImmutables ? "import org.immutables.value.Value;" : "";
        var file = "\n" + javaPackage + "\nimport java.util.List;\n" + imports + "\n/*\n* This class was automatically generated by Floodway.\n*/\n" + (generateImmutables ? "@Value.Enclosing" : "") + "\npublic class " + makeClassName(namespace.getName()) + "{\n    " + schemas + "\n    \n    " + functions + "\n}\n    ";
        fs.writeFileSync(path.join(outDir, makeClassName(namespace.getName()) + ".java"), file);
    });
}
