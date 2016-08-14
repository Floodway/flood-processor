"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var floodway_1 = require("floodway");
var FooAction = (function (_super) {
    __extends(FooAction, _super);
    function FooAction() {
        _super.apply(this, arguments);
    }
    FooAction.prototype.getMetaData = function () {
        return {
            name: "foo",
            description: "Foobar does stuff",
            supportsUpdates: true,
            params: new floodway_1.ObjectSchema().children({}),
            result: new floodway_1.ObjectSchema().children({}),
            middleware: [],
            errors: []
        };
    };
    FooAction.prototype.run = function () {
    };
    return FooAction;
}(floodway_1.Action));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FooAction;
