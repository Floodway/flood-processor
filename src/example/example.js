"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var StringSchema_1 = require("../validator/StringSchema");
var NumberSchema_1 = require("../validator/NumberSchema");
var ArraySchema_1 = require("../validator/ArraySchema");
var flood = new __entry_1.Floodway();
var webConnector = new __entry_1.WebConnector({
    port: 4040,
});
flood.registerConnector(webConnector);
flood.registerConnector(new __entry_1.WebSocketConnector({
    server: webConnector.getServer(),
    allowedOrigins: ["*"],
    port: null
}));
var TestAction = (function (_super) {
    __extends(TestAction, _super);
    function TestAction() {
        _super.apply(this, arguments);
    }
    TestAction.prototype.getWebConfig = function () {
        return {
            url: "/",
            methods: [__entry_1.HttpMethod.GET]
        };
    };
    TestAction.prototype.getMetaData = function () {
        return {
            params: new __entry_1.ObjectSchema("TestParamms").children({
                items: new ArraySchema_1.ArraySchema().child(new __entry_1.ObjectSchema("TestChild").children({
                    meta: new __entry_1.ObjectSchema("meta").children({
                        foo: new StringSchema_1.StringSchema(),
                        bar: new StringSchema_1.StringSchema()
                    }),
                    bar: new StringSchema_1.StringSchema()
                }))
            }),
            result: new __entry_1.ObjectSchema("TestActionResult").children({
                time: new NumberSchema_1.NumberSchema()
            }),
            errors: [],
            middleware: [],
            name: "test",
            supportsUpdates: false,
            description: "Test action"
        };
    };
    TestAction.prototype.run = function () {
        this.res({
            time: Date.now()
        });
    };
    return TestAction;
}(__entry_1.Action));
var ExampleNamespace = (function (_super) {
    __extends(ExampleNamespace, _super);
    function ExampleNamespace() {
        _super.call(this);
        this.action(TestAction);
    }
    ExampleNamespace.prototype.getName = function () {
        return "test";
    };
    return ExampleNamespace;
}(__entry_1.Namespace));
flood.registerNamespace(new ExampleNamespace());
module.exports = flood;
