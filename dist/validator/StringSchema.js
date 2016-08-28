"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var _ = require("lodash");
var StringSchema = (function (_super) {
    __extends(StringSchema, _super);
    function StringSchema() {
        _super.apply(this, arguments);
    }
    StringSchema.prototype.hasChildren = function () {
        return false;
    };
    StringSchema.prototype.toJSON = function () {
        return {
            type: "string",
            length: this.lengthN,
            minLength: this.minLengthN,
            maxLength: this.maxLengthN,
            trim: this.trimB,
            uppercase: this.toUpperCaseB,
            lowercase: this.toLowerCaseB
        };
    };
    StringSchema.isStringSchema = function (input) {
        return input.toJSON().type == "array";
    };
    StringSchema.prototype.validate = function (data, callback, path) {
        if (path === void 0) { path = "root"; }
        var item;
        if (_.isString(data)) {
            item = data;
        }
        else {
            return callback({
                error: "notString",
                path: path
            }, null);
        }
        if (this.lengthN != null) {
            if (this.lengthN != item.length) {
                return callback({
                    error: "invalidLength",
                    value: item,
                    neededLength: this.lengthN,
                    path: path
                }, null);
            }
        }
        if (this.minLengthN != null) {
            if (this.minLengthN > item.length) {
                return callback({
                    error: "tooShort",
                    path: path
                }, null);
            }
        }
        if (this.maxLengthN != null) {
            if (this.maxLengthN < item.length) {
                return callback({
                    error: "tooLong",
                    path: path
                }, null);
            }
        }
        if (this.trimB) {
            item = item.trim();
        }
        if (this.toLowerCaseB) {
            item = item.toLowerCase();
        }
        if (this.toUpperCaseB) {
            item = item.toUpperCase();
        }
        if (this.oneOfS != null) {
            if (this.oneOfS.indexOf(item) == -1) {
                return callback({ error: "invalidValue", allowedItems: this.oneOfS, path: path }, null);
            }
        }
        callback(null, item);
    };
    StringSchema.prototype.oneOf = function (input) {
        this.oneOfS = input;
        return this;
    };
    StringSchema.prototype.length = function (length) { this.lengthN = length; return this; };
    StringSchema.prototype.minLength = function (minLength) { this.minLengthN = minLength; return this; };
    StringSchema.prototype.maxLength = function (maxLength) { this.maxLengthN = maxLength; return this; };
    StringSchema.prototype.toUpperCase = function (uppercase) {
        if (uppercase === void 0) { uppercase = true; }
        this.toUpperCaseB = uppercase;
        return this;
    };
    StringSchema.prototype.toLowerCase = function (lowercase) {
        if (lowercase === void 0) { lowercase = true; }
        this.toLowerCaseB = lowercase;
        return this;
    };
    StringSchema.prototype.trim = function (trim) {
        if (trim === void 0) { trim = true; }
        this.trimB = trim;
        return this;
    };
    return StringSchema;
}(Type_1.Type));
exports.StringSchema = StringSchema;
