"use strict";
var chalk = require("chalk");
(function (Output) {
    Output[Output["Out"] = 0] = "Out";
    Output[Output["Error"] = 1] = "Error";
})(exports.Output || (exports.Output = {}));
var Output = exports.Output;
var Log = (function () {
    function Log(key) {
        this.key = key;
    }
    Log.prototype.getTime = function () {
        var date = new Date();
        return "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "][ " + this.key + " ]: ";
    };
    Log.prototype.log = function (data) {
        Log.print(chalk.blue(this.getTime()) + data, Output.Out);
    };
    Log.prototype.debug = function (data) {
        this.log(data);
    };
    Log.prototype.success = function (data) {
        Log.print(chalk.green(this.getTime()) + data, Output.Out);
    };
    Log.prototype.error = function (data) {
        Log.print(chalk.red(this.getTime()) + data, Output.Error);
    };
    Log.print = function (message, output) {
        switch (output) {
            case Output.Out:
                console.log(message);
                break;
            case Output.Error:
                console.error(message);
                break;
        }
    };
    return Log;
}());
exports.Log = Log;
