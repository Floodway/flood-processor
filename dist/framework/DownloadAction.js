"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var HttpMethod_1 = require("./HttpMethod");
var DownloadAction = (function (_super) {
    __extends(DownloadAction, _super);
    function DownloadAction() {
        _super.apply(this, arguments);
    }
    DownloadAction.isDownloadAction = function (input) {
        return input.isDAction !== undefined;
    };
    DownloadAction.prototype.getHttpMethods = function () {
        return [HttpMethod_1.HttpMethod.GET];
    };
    DownloadAction.prototype.isDAction = function () {
        return true;
    };
    DownloadAction.prototype.getWebMetaData = function () {
        return {
            name: this.getName(),
            supportsUpdates: false,
            description: "Obtain a download token for a file",
            params: this.getParams(),
            result: new __entry_1.ObjectSchema("FilePath").children({
                path: new __entry_1.StringSchema()
            }),
            middleware: this.getMiddleware(),
            errors: this.getErrors()
        };
    };
    DownloadAction.prototype.getMiddleware = function () {
        return [];
    };
    DownloadAction.prototype.getErrors = function () {
        return [];
    };
    return DownloadAction;
}(__entry_1.WebAction));
exports.DownloadAction = DownloadAction;
