"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Action_1 = require("./Action");
var BodyMode_1 = require("./BodyMode");
var WebAction = (function (_super) {
    __extends(WebAction, _super);
    function WebAction() {
        _super.call(this);
    }
    WebAction.prototype.getUrl = function () {
        return "/" + this.getMetaData().name;
    };
    WebAction.prototype.getBodyMode = function () {
        return BodyMode_1.BodyMode.JSON;
    };
    WebAction.prototype.useNamespaceRouter = function () {
        return true;
    };
    WebAction.prototype.allowUploads = function () {
        return false;
    };
    WebAction.prototype.getMetaData = function () {
        var meta = this.getWebMetaData();
        return {
            supportsUpdates: false,
            name: meta.name,
            description: meta.description,
            params: meta.params,
            result: meta.result,
            errors: meta.errors,
            middleware: meta.middleware
        };
    };
    WebAction.isWebAction = function (action) {
        return action.getUrl !== undefined;
    };
    return WebAction;
}(Action_1.Action));
exports.WebAction = WebAction;
