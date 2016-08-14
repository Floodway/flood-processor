"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Foo_1 = require("./actions/Foo");
var floodway_1 = require("floodway");
var Test = (function (_super) {
    __extends(Test, _super);
    function Test() {
        _super.call(this);
        this.action(Foo_1.default);
    }
    Test.prototype.getName = function () {
        return "Test";
    };
    return Test;
}(floodway_1.Namespace));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Test;
