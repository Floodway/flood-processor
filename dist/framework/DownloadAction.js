"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var DownloadAction = (function (_super) {
    __extends(DownloadAction, _super);
    function DownloadAction() {
        _super.apply(this, arguments);
    }
    DownloadAction.prototype.getMetaData = function () {
        return {
            name: this.getName(),
            supportsUpdates: false,
            description: "Obtain a download token for a file",
            params: this.getParams(),
            result: this.getResult(),
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
    DownloadAction.prototype.getResult = function () {
        return new __entry_1.ObjectSchema().children({
            downloadToken: new __entry_1.StringSchema()
        });
    };
    DownloadAction.prototype.getExpireTime = function () {
        return null;
    };
    DownloadAction.prototype.run = function () {
        var _this = this;
        var deleteAfterDownload = this.getExpireTime == null;
        var downloadToken = __entry_1.Utils.generateUUID();
        this.getFilePath(function (err, path) {
            console.log(path);
            if (err != null) {
                _this.fail("internalError", err);
            }
            else {
                _this.redis.hmset("fileDownload:" + downloadToken, {
                    namespace: _this.getCallbackInfo().namespace,
                    action: _this.getCallbackInfo().action,
                    deleteAfterDownload: deleteAfterDownload,
                    params: JSON.stringify(_this.getCallbackInfo().params),
                    path: path
                }, function (err, res) {
                    if (err != null) {
                        return _this.fail("internalError", err);
                    }
                    _this.res({
                        downloadToken: downloadToken
                    });
                });
            }
        });
    };
    return DownloadAction;
}(__entry_1.Action));
exports.DownloadAction = DownloadAction;
