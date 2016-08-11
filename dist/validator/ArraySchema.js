"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var _ = require("lodash");
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
    ArraySchema.prototype.build = function (path) {
        if (path === void 0) { path = "root"; }
        if (this.modeS == "uniform") {
            this.childrenT.build(path + ".child");
        }
        else {
            var i = 0;
            for (var _i = 0, _a = this.childrenLT; _i < _a.length; _i++) {
                var child = _a[_i];
                child.build(path + "[" + i + "]");
                i++;
            }
        }
        return this;
    };
    ArraySchema.prototype.validate = function (input, callback) {
        var _this = this;
        var data;
        if (_.isArray(input)) {
            data = input;
        }
        var group = new AsyncGroup_1.AsyncGroup(function (err, result) {
            if (err != null) {
                err.path = _this.path + "[" + err.index + "]";
                delete err.index;
            }
            callback(err, result);
        });
        switch (this.modeS) {
            case "uniform":
                var _loop_1 = function(child) {
                    group.add(function (done) {
                        _this.childrenT.validate(child, done);
                    });
                };
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var child = data_1[_i];
                    _loop_1(child);
                }
                break;
            case "unique":
                if (data.length <= this.childrenLT.length) {
                    var _loop_2 = function(index) {
                        group.add(function (done) {
                            _this.childrenLT[index].validate(data[index], done);
                        });
                    };
                    for (var index in data) {
                        _loop_2(index);
                    }
                }
                else {
                    callback({
                        error: "arrayMismatch",
                        path: this.path
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
