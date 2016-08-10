"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Type_1 = require("./Type");
var BooleanSchema = (function (_super) {
    __extends(BooleanSchema, _super);
    function BooleanSchema() {
        _super.apply(this, arguments);
    }
    BooleanSchema.prototype.toJSON = function () {
        return {
            type: "boolean"
        };
    };
    BooleanSchema.prototype.validate = function (data, callback) {
        var item = data == true;
        if (this.inverseB) {
            item = !item;
        }
        return callback(null, item);
    };
    BooleanSchema.prototype.hasChildren = function () {
        return false;
    };
    BooleanSchema.prototype.inverse = function (value) {
        if (value === void 0) { value = true; }
        this.inverseB = value;
        return this;
    };
    return BooleanSchema;
}(Type_1.Type));
exports.BooleanSchema = BooleanSchema;
