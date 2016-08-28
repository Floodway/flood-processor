"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __entry_1 = require("../__entry");
var flood_gate_1 = require("flood-gate");
var BodyMode_1 = require("../framework/BodyMode");
var Middleware_1 = require("../framework/Middleware");
var flood = new __entry_1.Floodway();
var webConnector = new __entry_1.WebConnector({
    port: 4040,
});
flood.registerConnector(webConnector);
flood.registerConnector(new __entry_1.WebSocketConnector({
    server: webConnector.getServer(),
    allowedOrigins: ["*"]
}));
var TestParams = (function () {
    function TestParams() {
    }
    __decorate([
        flood_gate_1.Str({ groups: ["exposed"] }),
        flood_gate_1.Str({ groups: ["middleware"], toUpperCase: true })
    ], TestParams.prototype, "name", void 0);
    TestParams = __decorate([
        flood_gate_1.Schema({ mode: flood_gate_1.SchemaMode.LOOSE })
    ], TestParams);
    return TestParams;
}());
var TestResult = (function () {
    function TestResult() {
    }
    __decorate([
        flood_gate_1.Str()
    ], TestResult.prototype, "name", void 0);
    TestResult = __decorate([
        flood_gate_1.Schema({ mode: flood_gate_1.SchemaMode.LOOSE })
    ], TestResult);
    return TestResult;
}());
var TestMiddleware = (function (_super) {
    __extends(TestMiddleware, _super);
    function TestMiddleware() {
        _super.apply(this, arguments);
    }
    TestMiddleware.prototype.getName = function () { return "testMiddleware"; };
    TestMiddleware.prototype.getDescription = function () { return ""; };
    TestMiddleware.prototype.getParamsClass = function () { return TestParams; };
    TestMiddleware.prototype.getGroup = function () { return "middleware"; };
    TestMiddleware.prototype.run = function () {
        this.next();
    };
    return TestMiddleware;
}(Middleware_1.Middleware));
var TestAction = (function (_super) {
    __extends(TestAction, _super);
    function TestAction() {
        _super.apply(this, arguments);
    }
    TestAction.prototype.getUrl = function () { return "/test"; };
    TestAction.prototype.getHttpMethods = function () { return [__entry_1.HttpMethod.GET]; };
    TestAction.prototype.getBodyMode = function () { return BodyMode_1.BodyMode.JSON; };
    TestAction.prototype.useNamespaceRouter = function () { return true; };
    TestAction.prototype.getParamsClass = function () { return TestParams; };
    TestAction.prototype.getGroup = function () { return "exposed"; };
    TestAction.prototype.getMiddleware = function () { return [new TestMiddleware()]; };
    TestAction.prototype.getResultClass = function () { return TestResult; };
    TestAction.prototype.getName = function () { return "testAction"; };
    TestAction.prototype.getDescription = function () { return "Does something!"; };
    TestAction.prototype.run = function () {
        var result = new TestResult();
        result.name = this.getParams().name;
        this.res(result);
    };
    return TestAction;
}(__entry_1.Action));
var Test = (function (_super) {
    __extends(Test, _super);
    function Test() {
        _super.call(this);
        this.action(TestAction);
    }
    Test.prototype.getName = function () {
        return "test";
    };
    return Test;
}(__entry_1.Namespace));
flood.registerNamespace(new Test());
module.exports = flood;
