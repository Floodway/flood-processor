"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var _ = require("lodash");
var express = require("express");
var fs = require("fs");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var multer = require("multer");
var http_1 = require("http");
var upload = multer({ dest: path.join(process.cwd(), "./uploads") });
(function (BodyMode) {
    BodyMode[BodyMode["JSON"] = 0] = "JSON";
    BodyMode[BodyMode["UrlEncoded"] = 1] = "UrlEncoded";
})(exports.BodyMode || (exports.BodyMode = {}));
var BodyMode = exports.BodyMode;
(function (HttpMethod) {
    HttpMethod[HttpMethod["GET"] = 0] = "GET";
    HttpMethod[HttpMethod["POST"] = 1] = "POST";
    HttpMethod[HttpMethod["PATCH"] = 2] = "PATCH";
    HttpMethod[HttpMethod["DELETE"] = 3] = "DELETE";
    HttpMethod[HttpMethod["HEAD"] = 4] = "HEAD";
})(exports.HttpMethod || (exports.HttpMethod = {}));
var HttpMethod = exports.HttpMethod;
function isWebAction(action) {
    return action.getWebConfig !== undefined;
}
var WebConnector = (function (_super) {
    __extends(WebConnector, _super);
    function WebConnector(config) {
        _super.call(this);
        this.config = config;
        this.app = express();
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', 'http://localhost');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.app.use(cookieParser());
        this.server = http_1.createServer(this.app);
    }
    WebConnector.prototype.getServer = function () {
        return this.server;
    };
    WebConnector.prototype.getMeta = function () {
        return {
            name: "WebConnector",
            additionalData: {
                port: this.config.port
            }
        };
    };
    WebConnector.prototype.handleRequest = function (namespace, actionI, req, res) {
        var action = new actionI();
        var params = _.extend(req.body, req.params, req.query);
        var ssid;
        if (req.cookies["flood-ssid"] == null) {
            ssid = __entry_1.Utils.generateUUID();
            res.cookie("flood-ssid", ssid, { httpOnly: true, expires: new Date(Date.now() + 900000) });
        }
        else {
            ssid = req.cookies["flood-ssid"];
        }
        if (isWebAction(action)) {
            action.populate({
                namespace: namespace.getName(),
                params: params,
                requestId: "web:" + __entry_1.Utils.generateUUID(),
                sessionId: ssid,
                sendData: function (data) {
                    res.json(data);
                }
            }, this.floodway);
        }
        else {
            res.json({
                messageType: "error",
                requestId: "web:" + __entry_1.Utils.generateUUID(),
                error: {
                    errorCode: "internalError",
                    description: "The registered action is not compatible with this protocol"
                }
            });
            action.done();
        }
    };
    WebConnector.prototype.start = function (floodway) {
        var _this = this;
        this.floodway = floodway;
        var namespaces = floodway.getNamespaces();
        for (var _i = 0, _a = Object.keys(namespaces); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var namespace = namespaces[name_1];
            for (var _b = 0, _c = Object.keys(namespace.getActions()); _b < _c.length; _b++) {
                var actionName = _c[_b];
                var actionI = namespace.getAction(actionName);
                var actionIC = new actionI();
                var action = new actionI();
                if (isWebAction(action) && !actionIC.getMetaData().supportsUpdates) {
                    var config = action.getWebConfig();
                    for (var _d = 0, _e = config.methods; _d < _e.length; _d++) {
                        var method = _e[_d];
                        switch (method) {
                            case HttpMethod.GET:
                                this.app.get(config.url, config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true }), this.handleRequest.bind(this, namespace, actionI));
                                break;
                            case HttpMethod.POST:
                                this.app.post(config.url, config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true }), this.handleRequest.bind(this, namespace, actionI));
                                break;
                            case HttpMethod.HEAD:
                                this.app.head(config.url, config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true }), this.handleRequest.bind(this, namespace, actionI));
                                break;
                            case HttpMethod.PATCH:
                                this.app.patch(config.url, config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true }), this.handleRequest.bind(this, namespace, actionI));
                                break;
                            case HttpMethod.DELETE:
                                this.app.delete(config.url, config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true }), this.handleRequest.bind(this, namespace, actionI));
                                break;
                        }
                    }
                }
            }
        }
        this.app.post("/upload/:fileToken", upload.single("upload"), function (req, res) {
            _this.floodway.getRedis().hgetall(req.params.fileToken, function (err, result) {
                if (err != null || result == null) {
                    res.status(403);
                    if (req.file.path != null) {
                        try {
                            fs.unlinkSync(req.file.path);
                        }
                        catch (e) {
                            console.error("Deleting file failed...");
                        }
                    }
                    res.json({
                        status: false
                    });
                }
                else {
                    console.log(result);
                    res.json({
                        status: true,
                    });
                }
            });
        });
        this.server.listen(this.config.port);
    };
    return WebConnector;
}(__entry_1.Connector));
exports.WebConnector = WebConnector;
