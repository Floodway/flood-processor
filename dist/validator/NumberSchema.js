"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var NumberSchema = (function (_super) {
    __extends(NumberSchema, _super);
    function NumberSchema() {
        _super.apply(this, arguments);
    }
    NumberSchema.prototype.hasChildren = function () {
        return false;
    };
    NumberSchema.prototype.toJSON = function () {
        return {
            type: "number",
            allowDecimals: this.allowDecimalsB,
            round: this.roundB,
            floor: this.floorB,
            ceil: this.ceilB,
            min: this.minN,
            max: this.maxN,
            blacklist: this.blackListN,
            whitelist: this.whiteListN
        };
    };
    NumberSchema.prototype.validate = function (data, callback) {
        var item;
        try {
            item = Number(data);
        }
        catch (e) {
            callback({
                error: "notNumber",
                path: this.path
            }, null);
        }
        if (item != null) {
            if (this.roundB) {
                item = Math.round(item);
            }
            if (this.floorB) {
                item = Math.floor(item);
            }
            if (this.ceilB) {
                item = Math.ceil(item);
            }
            if (this.blackListN != null) {
                if (this.blackListN.indexOf(item) != -1) {
                    return callback({
                        error: "invalidValue",
                        disallowedItems: this.blackListN
                    }, null);
                }
            }
            if (this.whiteListN != null) {
                if (this.whiteListN.indexOf(item) == -1) {
                    return callback({
                        error: "invalidValue",
                        allowedItems: this.whiteListN
                    }, null);
                }
            }
            if (this.minN != null) {
                if (item < this.minN) {
                    return callback({
                        error: "tooSmallValue",
                        min: this.minN
                    }, null);
                }
            }
            if (this.maxN != null) {
                if (item > this.maxN) {
                    return callback({
                        error: "tooBigValue",
                        max: this.maxN
                    }, null);
                }
            }
        }
        callback(null, item);
    };
    NumberSchema.prototype.ceil = function (value) {
        this.ceilB = value;
        return this;
    };
    NumberSchema.prototype.floor = function (value) {
        this.floorB = value;
        return this;
    };
    NumberSchema.prototype.round = function (value) {
        this.roundB = value;
        return this;
    };
    NumberSchema.prototype.allow = function (values) {
        this.whiteListN = values;
        return this;
    };
    NumberSchema.prototype.disallow = function (values) {
        this.blackListN = values;
        return this;
    };
    return NumberSchema;
}(Type_1.Type));
exports.NumberSchema = NumberSchema;
