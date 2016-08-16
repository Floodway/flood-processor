"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var _ = require("lodash");
var chalk = require("chalk");
var AsyncGroup_1 = require("../utils/AsyncGroup");
var ArraySchema = (function (_super) {
    __extends(ArraySchema, _super);
    function ArraySchema() {
        _super.apply(this, arguments);
    }
    ArraySchema.prototype.hasChildren = function () {
        return true;
    };
    ArraySchema.prototype.toJSON = function () {
        return {
            type: "array",
            mode: this.modeS,
            children: this.childrenT != null ? this.childrenT.toJSON() : this.childrenLT.map(function (item) { return item.toJSON(); })
        };
    };
    ArraySchema.prototype.getMode = function () {
        return this.modeS;
    };
    ArraySchema.prototype.getChildSchema = function () {
        return this.childrenT;
    };
    ArraySchema.prototype.child = function (child) {
        this.childrenT = child;
        this.modeS = "uniform";
        return this;
    };
    ArraySchema.prototype.children = function (child) {
        this.childrenLT = child;
        this.modeS = "unique";
        return this;
    };
    ArraySchema.prototype.validate = function (input, callback, path) {
        var _this = this;
        if (path === void 0) { path = "root"; }
        var data;
        if (_.isArray(input)) {
            data = input;
        }
        if (path == "root") {
            console.log(chalk.red("Warning: ArraySchema at Root. Please use an Object to ensure proper conversion to Java Classes."));
        }
        var group = new AsyncGroup_1.AsyncGroup(callback);
        switch (this.modeS) {
            case "uniform":
                data.map(function (item, index) {
                    group.add(function (done) {
                        _this.childrenT.validate(item, done, path + "[" + index + "]");
                    });
                });
                break;
            case "unique":
                if (data.length <= this.childrenLT.length) {
                    var _loop_1 = function(index) {
                        group.add(function (done) {
                            _this.childrenLT[index].validate(data[index], done, path + "[" + index + "]");
                        });
                    };
                    for (var index in data) {
                        _loop_1(index);
                    }
                }
                else {
                    callback({
                        error: "arrayLengthMismatch",
                        path: path
                    }, null);
                }
        }
        group.run();
    };
    return ArraySchema;
}(Type_1.Type));
exports.ArraySchema = ArraySchema;
(function (ArrayMode) {
    ArrayMode[ArrayMode["Index"] = 0] = "Index";
    ArrayMode[ArrayMode["Uniform"] = 1] = "Uniform";
})(exports.ArrayMode || (exports.ArrayMode = {}));
var ArrayMode = exports.ArrayMode;
