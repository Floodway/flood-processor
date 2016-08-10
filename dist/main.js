"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Floodway_1 = require("./Floodway");
var Namespace_1 = require("./Namespace");
var StringSchema_1 = require("./validator/StringSchema");
var WebConnector_1 = require("./WebConnector");
var ObjectSchema_1 = require("./validator/ObjectSchema");
var Action_1 = require("./Action");
var WebSocketConnector_1 = require("./WebSocketConnector");
var NumberSchema_1 = require("./validator/NumberSchema");
var ArraySchema_1 = require("./validator/ArraySchema");
var testAction = (function (_super) {
    __extends(testAction, _super);
    function testAction() {
        _super.apply(this, arguments);
    }
    testAction.prototype.getMetaData = function () {
        return {
            name: "testAction",
            description: "Test action",
            params: new ObjectSchema_1.ObjectSchema().children({
                name: new StringSchema_1.StringSchema(),
                child: new ObjectSchema_1.ObjectSchema().children({
                    childOne: new ArraySchema_1.ArraySchema().children([new StringSchema_1.StringSchema(), new NumberSchema_1.NumberSchema()]),
                    childOnePointFive: new ArraySchema_1.ArraySchema().child(new StringSchema_1.StringSchema().trim()),
                    childTwo: new NumberSchema_1.NumberSchema().ceil(true)
                })
            }),
            result: new ObjectSchema_1.ObjectSchema().children({
                youEntered: new StringSchema_1.StringSchema()
            }),
            middleware: [],
            supportsUpdates: false,
            errors: [{ errorCode: "failedYouHave", description: "Something went wong" }]
        };
    };
    testAction.prototype.getWebConfig = function () {
        return {
            methods: [WebConnector_1.HttpMethod.GET],
            url: "/",
            bodyMode: WebConnector_1.BodyMode.JSON
        };
    };
    testAction.prototype.run = function () {
        this.res({
            youEntered: this.params.name
        });
    };
    return testAction;
}(Action_1.Action));
var TestNamespace = (function (_super) {
    __extends(TestNamespace, _super);
    function TestNamespace() {
        _super.call(this);
        this.action(testAction);
    }
    TestNamespace.prototype.getName = function () { return "testNamespace"; };
    TestNamespace.prototype.getMiddleware = function () {
        return [];
    };
    TestNamespace.prototype.start = function (instance) {
    };
    return TestNamespace;
}(Namespace_1.Namespace));
var aboutAction = (function (_super) {
    __extends(aboutAction, _super);
    function aboutAction() {
        _super.apply(this, arguments);
    }
    aboutAction.prototype.getMetaData = function () {
        return {
            name: "about",
            description: "Returns a counter",
            params: new ObjectSchema_1.ObjectSchema().children({}).build("NoParams"),
            result: new ObjectSchema_1.ObjectSchema().children({
                count: new NumberSchema_1.NumberSchema()
            }).build("AboutResult"),
            middleware: [],
            supportsUpdates: false,
            errors: []
        };
    };
    aboutAction.prototype.getWebConfig = function () {
        return {
            methods: [WebConnector_1.HttpMethod.GET, WebConnector_1.HttpMethod.POST],
            url: "/main/about",
            bodyMode: WebConnector_1.BodyMode.JSON
        };
    };
    aboutAction.prototype.run = function () {
        var _this = this;
        this.redis.incr("foobar");
        this.redis.get("foobar", function (err, res) {
            console.log("Waited for redis");
            _this.res({
                count: res
            });
        });
    };
    return aboutAction;
}(Action_1.Action));
var MainNamespace = (function (_super) {
    __extends(MainNamespace, _super);
    function MainNamespace() {
        _super.call(this);
        this.action(aboutAction);
    }
    MainNamespace.prototype.getName = function () { return "main"; };
    MainNamespace.prototype.start = function (instance) {
    };
    return MainNamespace;
}(Namespace_1.Namespace));
var flood = new Floodway_1.Floodway();
flood.registerNamespace(new TestNamespace());
flood.registerNamespace(new MainNamespace());
var webConnector = new WebConnector_1.WebConnector({
    port: 4040
});
flood.registerConnector(webConnector);
flood.registerConnector(new WebSocketConnector_1.WebSocketConnector({
    server: webConnector.getServer(),
    port: 4041,
    allowedOrigins: ["*"],
}));
flood.start();
module.exports = flood;
