"use strict";
var utils_1 = require("../utils/utils");
var fs = require("fs");
var path = require("path");
var multer = require("multer");
var upload = multer({ dest: path.join(process.cwd(), "./uploads") });
var FileEndPoints = (function () {
    function FileEndPoints() {
    }
    FileEndPoints.prototype.register = function (connector) {
        this.connector = connector;
        this.floodway = connector.getFloodway();
        this.connector.getApp().post("/upload/:fileToken", upload.single("file"), this.onUpload.bind(this));
        this.connector.getApp().get("/file/:fileToken", this.onDownload.bind(this));
    };
    FileEndPoints.prototype.fail = function (res, errorCode, description) {
        res.json({
            messageType: "error",
            requestId: utils_1.Utils.generateUUID(),
            params: {
                errorCode: errorCode,
                description: description
            }
        });
    };
    FileEndPoints.prototype.onUpload = function (req, res) {
        var _this = this;
        if (req.file == null) {
            return this.fail(res, "missingFile", "No file was uploaded");
        }
        this.floodway.getRedis().hgetall("fileUpload:" + req.params.fileToken, function (err, fileInfo) {
            if (err != null || fileInfo == null) {
                try {
                    fs.unlinkSync(req.file.path);
                }
                catch (e) {
                    console.error("Could not unlink file", e);
                }
                return _this.fail(res, "invalidToken", "Could not upload file. Token was invalid");
            }
            _this.floodway.getRedis().del("fileUpload:" + req.params.fileToken, function (err, delInfo) {
                if (err != null) {
                    return _this.fail(res, "internalError", "Something went wrong.");
                }
                var namespace = _this.floodway.getNamespace(fileInfo.namespace);
                if (namespace == null) {
                    return _this.fail(res, "unknownNamespace", "The namespace was not found.");
                }
                if (namespace.hasAction(fileInfo.action)) {
                    req.params = JSON.parse(fileInfo.params);
                    req.params.file = req.file;
                    _this.connector.handleRequest(namespace, namespace.getAction(fileInfo.action), req, res);
                }
                else {
                    return _this.fail(res, "unknownAction", "The action was not found.");
                }
            });
        });
    };
    FileEndPoints.prototype.performDownload = function (req, res, downloadInfo) {
        var namespace = this.floodway.getNamespace(downloadInfo.namespace);
        if (namespace == null) {
            return this.fail(res, "unknownNamespace", "The namespace was not found");
        }
        if (namespace.hasAction(downloadInfo.action)) {
            req.body = JSON.parse(downloadInfo.params);
            res.json = function (data) {
                return null;
            };
            this.connector.handleRequest(namespace, namespace.getAction(downloadInfo.action), req, res);
            try {
                res.sendFile(downloadInfo.path);
            }
            catch (e) {
                console.error("Could not send file: " + downloadInfo.path + " does not exist");
            }
        }
        else {
            this.fail(res, "unknownAction", "The action provided was not found");
        }
    };
    FileEndPoints.prototype.onDownload = function (req, res) {
        var _this = this;
        this.floodway.getRedis().hgetall("fileDownload:" + req.params.fileToken, function (err, downloadInfo) {
            if (err != null || downloadInfo == null) {
                return _this.fail(res, "invalidToken", "Could not download file");
            }
            if (downloadInfo.deleteAfterDownload) {
                _this.floodway.getRedis().del("fileDownload:" + req.params.fileToken, function (err, delRes) {
                    if (err != null) {
                        return _this.fail(res, "internalError", "Something went wrong.");
                    }
                    _this.performDownload(req, res, downloadInfo);
                });
            }
            else {
                _this.performDownload(req, res, downloadInfo);
            }
        });
    };
    return FileEndPoints;
}());
exports.FileEndPoints = FileEndPoints;
