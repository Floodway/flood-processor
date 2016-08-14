"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var floodway_1 = require("floodway");
var TestAction = (function (_super) {
    __extends(TestAction, _super);
    function TestAction() {
        _super.apply(this, arguments);
    }
    TestAction.prototype.getWebConfig = function () {
        return {
            url: "/foo/bar",
            methods: [floodway_1.HttpMethod.GET]
        };
    };
    TestAction.prototype.getMetaData = function () {
        return {
            name: "testAction",
            description: "Does stuff",
            supportsUpdates: false,
            params: new ObjectSchema().children({}),
            result: new ObjectSchema().children({}),
            middleware: [],
            errors: []
        };
    };
    TestAction.prototype.run = function () {
    };
    return TestAction;
}(floodway_1.Action));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestAction;
