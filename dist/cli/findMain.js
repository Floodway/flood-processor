"use strict";
var path = require("path");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function () {
    var packageJson;
    try {
        packageJson = require(path.join(process.cwd(), "./package.json"));
    }
    catch (e) {
        console.error("Could not find package JSON, make sure you're at the root of your project: ", e);
        return null;
    }
    console.log(packageJson.floodMain);
    if (packageJson.floodMain != null) {
        var main = void 0;
        try {
            main = require(path.join(process.cwd(), packageJson.floodMain));
        }
        catch (e) {
            throw e;
        }
        if (main.start != null) {
            return {
                main: main,
                packageJson: packageJson
            };
        }
        else {
            console.error("Could not find floodway instance. Make sure it is exported");
        }
    }
    else {
        console.error("Could not locate main script in your package.json");
        return null;
    }
};
