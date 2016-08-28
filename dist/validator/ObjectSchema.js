"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var AsyncGroup_1 = require("../utils/AsyncGroup");
(function (ObjectMode) {
    ObjectMode[ObjectMode["STRICT"] = 0] = "STRICT";
    ObjectMode[ObjectMode["LOOSE"] = 1] = "LOOSE";
    ObjectMode[ObjectMode["SHORTEN"] = 2] = "SHORTEN";
    ObjectMode[ObjectMode["PARTIAL"] = 3] = "PARTIAL";
})(exports.ObjectMode || (exports.ObjectMode = {}));
var ObjectMode = exports.ObjectMode;
var ObjectSchema = (function (_super) {
    __extends(ObjectSchema, _super);
    function ObjectSchema(className) {
        _super.call(this);
        this.childrenT = {};
        this.className = this.makeClassName(className);
        this.modeS = ObjectMode.LOOSE;
    }
    ObjectSchema.prototype.makeClassName = function (input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    };
    ObjectSchema.prototype.modeToString = function (mode) {
        switch (mode) {
            case ObjectMode.LOOSE:
                return "LOOSE";
            case ObjectMode.SHORTEN:
                return "SHORTEN";
            case ObjectMode.STRICT:
                return "STRICT";
        }
    };
    ObjectSchema.isObjectSchema = function (input) {
        return input.toJSON().type == "object";
    };
    ObjectSchema.prototype.toJSON = function () {
        var children = {};
        for (var _i = 0, _a = Object.keys(this.childrenT); _i < _a.length; _i++) {
            var key = _a[_i];
            children[key] = this.childrenT[key].toJSON();
        }
        return {
            type: "object",
            mode: this.modeToString(this.modeS),
            className: this.getClassName(),
            children: children
        };
    };
    ObjectSchema.prototype.hasChildren = function () {
        return true;
    };
    ObjectSchema.prototype.children = function (children) {
        this.childrenT = children;
        return this;
    };
    ObjectSchema.prototype.getChild = function (name) {
        return this.childrenT[name];
    };
    ObjectSchema.prototype.getChildren = function () {
        return this.childrenT;
    };
    ObjectSchema.prototype.getClassName = function () {
        return this.className;
    };
    ObjectSchema.prototype.mode = function (mode) {
        this.modeS = mode;
        return this;
    };
    ObjectSchema.prototype.validate = function (item, callback, path) {
        var _this = this;
        if (path === void 0) { path = "root"; }
        var group;
        var newValue = {};
        if (item == null) {
            return callback({ error: "notPresent", path: path }, null);
        }
        if (this.modeS == ObjectMode.STRICT) {
            var valid = true;
            var missingKey = void 0;
            for (var _i = 0, _a = Object.keys(this.childrenT); _i < _a.length; _i++) {
                var key = _a[_i];
                if (!item.hasOwnProperty(key)) {
                    valid = false;
                    missingKey = key;
                    break;
                }
            }
            if (Object.keys(item).length != Object.keys(this.childrenT).length) {
                valid = false;
            }
            if (!valid) {
                return callback({
                    error: "invalidKeys",
                    description: "Not all or too many keys supplied.",
                    path: path,
                    missingKey: missingKey
                }, null);
            }
        }
        group = new AsyncGroup_1.AsyncGroup(function (err, r) {
            if (err != null) {
                callback(err, null);
            }
            else {
                if (_this.modeS == ObjectMode.LOOSE) {
                    callback(null, item);
                }
                else {
                    callback(null, newValue);
                }
            }
        });
        var _loop_1 = function(key) {
            if (this_1.modeS == ObjectMode.PARTIAL) {
                if (item[key] == null) {
                    if (this_1.childrenT[key].getDefault() != null) {
                        group.add(function (callback) {
                            newValue[key] = _this.childrenT[key].getDefault();
                        });
                    }
                    return "continue";
                }
            }
            group.add(function (callback) {
                _this.childrenT[key].validate(item[key], function (err, res) {
                    if (err) {
                        return callback(err, null);
                    }
                    else {
                        if (_this.modeS == ObjectMode.LOOSE) {
                            item[key] = res;
                        }
                        else {
                            newValue[key] = res;
                        }
                        callback(null, null);
                    }
                }, path + "." + key);
            });
        };
        var this_1 = this;
        for (var _b = 0, _c = Object.keys(this.childrenT); _b < _c.length; _b++) {
            var key = _c[_b];
            var state_1 = _loop_1(key);
            if (state_1 === "continue") continue;
        }
        group.run();
    };
    ;
    return ObjectSchema;
}(Type_1.Type));
exports.ObjectSchema = ObjectSchema;
