"use strict";
var AsyncGroup_1 = require("../utils/AsyncGroup");
var SchemaItem = (function () {
    function SchemaItem(options, constructor) {
        this.options = options;
        this.constructor = constructor;
        this.constraints = {};
    }
    SchemaItem.prototype.getName = function () {
        return this.constructor["name"];
    };
    SchemaItem.prototype.addConstraint = function (path, constraint) {
        constraint.options = makeDefault(constraint.options, {
            groups: [],
            optional: false,
            default: null
        });
        this.constraints[path] = constraint;
    };
    SchemaItem.prototype.setOptions = function (options) {
        this.options = options;
    };
    SchemaItem.prototype.getConstraintsForGroup = function (group) {
        var result = {};
        for (var _i = 0, _a = Object.keys(this.constraints); _i < _a.length; _i++) {
            var key = _a[_i];
            if (this.constraints[key].options.groups.length == 0) {
                result[key] = this.constraints[key];
            }
            else {
                if (this.constraints[key].options.groups.indexOf(group) != -1) {
                    result[key] = this.constraints[key];
                }
            }
        }
        return result;
    };
    SchemaItem.prototype.validate = function (data, callback, group, path) {
        var _this = this;
        var resultItem = {};
        var constraints = this.getConstraintsForGroup(group);
        if (this.options.mode == SchemaMode.LOOSE) {
            resultItem = data;
        }
        if (this.options.mode == SchemaMode.STRICT) {
            var match = true;
            if (Object.keys(data).length != Object.keys(constraints).length) {
                return callback({
                    errorCode: "keyMismatch",
                    description: "Object could not be matched. It is either missing keys or has too many",
                    path: path + "." + this.getName()
                }, null);
            }
            for (var _i = 0, _a = Object.keys(constraints); _i < _a.length; _i++) {
                var key = _a[_i];
                if (!data.hasOwnProperty(key)) {
                    match = false;
                    break;
                }
            }
        }
        var asyncGroup = new AsyncGroup_1.AsyncGroup(function (err, data) {
            if (err != null) {
                callback(err, null);
            }
            else {
                callback(null, resultItem);
            }
        });
        console.log(constraints);
        var _loop_1 = function(key) {
            asyncGroup.add(function (done) {
                var constraint = constraints[key];
                if (data.hasOwnProperty(key)) {
                    constraint.validate(data[key], function (err, item) {
                        if (err != null) {
                            done(err, null);
                        }
                        else {
                            resultItem[key] = item;
                            done(null, null);
                        }
                    }, path);
                }
                else {
                    if (constraint.options.optional) {
                        resultItem[key] = constraint.options.default;
                        done(null, null);
                    }
                    else {
                        done({
                            errorCode: "missingProperty",
                            description: "Property " + key + " is missing on the schema",
                            path: path + "." + _this.getName()
                        }, null);
                    }
                }
            });
        };
        for (var _b = 0, _c = Object.keys(constraints); _b < _c.length; _b++) {
            var key = _c[_b];
            _loop_1(key);
        }
        asyncGroup.run();
    };
    return SchemaItem;
}());
exports.SchemaItem = SchemaItem;
(function (SchemaMode) {
    SchemaMode[SchemaMode["LOOSE"] = 0] = "LOOSE";
    SchemaMode[SchemaMode["STRICT"] = 1] = "STRICT";
    SchemaMode[SchemaMode["SHORTEN"] = 2] = "SHORTEN";
})(exports.SchemaMode || (exports.SchemaMode = {}));
var SchemaMode = exports.SchemaMode;
function Schema(options) {
    return function (constructor) {
        schemaStore.registerSchema(constructor, options);
    };
}
exports.Schema = Schema;
var SchemaStore = (function () {
    function SchemaStore() {
        this.schemas = {};
    }
    SchemaStore.prototype.validate = function (item, callback, group, path) {
        if (group === void 0) { group = null; }
        if (path === void 0) { path = item.constructor["name"]; }
        if (this.schemas[item.constructor] == null) {
            throw new Error("Can not validate unregistered Schema!. Passed value is not a known Schema!");
        }
        else {
            this.schemas[item.constructor].validate(item, callback, group, path);
        }
    };
    SchemaStore.prototype.addConstraint = function (c, name, constraint) {
        var constructor = c.constructor;
        if (this.schemas[constructor] == null) {
            this.schemas[constructor] = new SchemaItem({ mode: SchemaMode.SHORTEN }, constructor);
        }
        this.schemas[constructor].addConstraint(name, constraint);
    };
    SchemaStore.prototype.registerSchema = function (constructor, options) {
        if (this.schemas[constructor] == null) {
            this.schemas[constructor] = new SchemaItem(options, constructor);
        }
        else {
            this.schemas[constructor].setOptions(options);
        }
    };
    return SchemaStore;
}());
exports.SchemaStore = SchemaStore;
var schemaStore = new SchemaStore();
exports.schemaStore = schemaStore;
function makeDefault(value, defaults) {
    for (var _i = 0, _a = Object.keys(defaults); _i < _a.length; _i++) {
        var key = _a[_i];
        if (!value.hasOwnProperty(key)) {
            value[key] = defaults[key];
        }
    }
    return value;
}
exports.makeDefault = makeDefault;
