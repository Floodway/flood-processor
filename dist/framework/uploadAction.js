"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var utils_1 = require("../utils/utils");
var UploadAction = (function (_super) {
    __extends(UploadAction, _super);
    function UploadAction() {
        _super.apply(this, arguments);
    }
    UploadAction.prototype.getParams = function () {
        return new __entry_1.ObjectSchema().children({});
    };
    UploadAction.prototype.getResult = function () {
        return new __entry_1.ObjectSchema().children({
            uploadToken: new __entry_1.StringSchema()
        });
    };
    UploadAction.prototype.getMiddleware = function () {
        return [];
    };
    UploadAction.prototype.getMetaData = function () {
        return {
            params: this.getParams(),
            result: this.getResult(),
            supportsUpdates: false,
            name: this.getName(),
            description: "Obtain a token to upload a file",
            middleware: this.getMiddleware(),
            errors: []
        };
    };
    UploadAction.prototype.run = function () {
        var _this = this;
        var callBackInfo = this.getCallbackInfo();
        var uploadToken = utils_1.Utils.generateUUID();
        this.redis.hmset("fileUpload:" + uploadToken, {
            action: callBackInfo.action,
            namespace: callBackInfo.namespace,
            params: JSON.stringify(callBackInfo.params)
        }, function (err, res) {
            if (err) {
                _this.fail("internalError", err);
            }
            else {
                _this.res({
                    uploadToken: uploadToken
                });
            }
        });
    };
    return UploadAction;
}(__entry_1.Action));
exports.UploadAction = UploadAction;
