"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var floodway_1 = require("floodway");
var Test = (function (_super) {
    __extends(Test, _super);
    function Test() {
        _super.apply(this, arguments);
    }
    Test.prototype.getMetaData = function () {
        return {
            name: "test",
            description: "Does stuff",
            supportsUpdates: true,
            params: new floodway_1.ObjectSchema().children({}),
            result: new floodway_1.ObjectSchema().children({}),
            middleware: [],
            errors: []
        };
    };
    Test.prototype.run = function () {
    };
    return Test;
}(floodway_1.Action));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Test;
