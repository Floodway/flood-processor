"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var HttpMethod_1 = require("./HttpMethod");
var DownloadResult = (function () {
    function DownloadResult() {
    }
    return DownloadResult;
}());
exports.DownloadResult = DownloadResult;
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
    return DownloadAction;
}(__entry_1.Action));
exports.DownloadAction = DownloadAction;
