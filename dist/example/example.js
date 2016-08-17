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
var DownloadAction_1 = require("../framework/DownloadAction");
var BodyMode_1 = require("../framework/BodyMode");
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
    TestAction.prototype.getHttpMethods = function () {
        return [__entry_1.HttpMethod.POST];
    };
    TestAction.prototype.getWebMetaData = function () {
        return {
            params: new __entry_1.ObjectSchema("TestParams").children({
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
            description: "Test action"
        };
    };
    TestAction.prototype.run = function () {
        this.res({
            time: Date.now()
        });
    };
    return TestAction;
}(__entry_1.WebAction));
var ExampleDownload = (function (_super) {
    __extends(ExampleDownload, _super);
    function ExampleDownload() {
        _super.apply(this, arguments);
    }
    ExampleDownload.prototype.getName = function () {
        return "download";
    };
    ExampleDownload.prototype.getParams = function () {
        return new __entry_1.ObjectSchema("NoParams").children({});
    };
    ExampleDownload.prototype.run = function () {
        this.res({
            path: "C:\\im.jpg"
        });
    };
    return ExampleDownload;
}(DownloadAction_1.DownloadAction));
var ExampleUpload = (function (_super) {
    __extends(ExampleUpload, _super);
    function ExampleUpload() {
        _super.apply(this, arguments);
    }
    ExampleUpload.prototype.allowUploads = function () {
        return true;
    };
    ExampleUpload.prototype.getHttpMethods = function () {
        return [__entry_1.HttpMethod.POST];
    };
    ExampleUpload.prototype.getBodyMode = function () {
        return BodyMode_1.BodyMode.UrlEncoded;
    };
    ExampleUpload.prototype.getWebMetaData = function () {
        return {
            name: "upload",
            description: "Uploads a file",
            result: new __entry_1.ObjectSchema("NoRes").children({}),
            params: new __entry_1.ObjectSchema("ExampleUploadParamsProcessed").children({
                file: __entry_1.FileSchema
            }),
            exposeParams: new __entry_1.ObjectSchema("ExampleUploadParams").children({
                file: new StringSchema_1.StringSchema()
            }),
            errors: [],
            middleware: []
        };
    };
    ExampleUpload.prototype.run = function () {
        console.log(this.params);
        this.res({});
    };
    return ExampleUpload;
}(__entry_1.WebAction));
var ExampleNamespace = (function (_super) {
    __extends(ExampleNamespace, _super);
    function ExampleNamespace() {
        _super.call(this);
        this.action(TestAction);
        this.action(ExampleDownload);
        this.action(ExampleUpload);
    }
    ExampleNamespace.prototype.getName = function () {
        return "test";
    };
    return ExampleNamespace;
}(__entry_1.Namespace));
flood.registerNamespace(new ExampleNamespace());
module.exports = flood;
