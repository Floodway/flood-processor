"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __entry_1 = require("../__entry");
var _ = require("lodash");
var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var http_1 = require("http");
var fs = require("fs");
var path = require("path");
var DownloadAction_1 = require("./DownloadAction");
var multer = require("multer");
var WebAction_1 = require("./WebAction");
var HttpMethod_1 = require("./HttpMethod");
var BodyMode_1 = require("./BodyMode");
var upload = multer({ dest: path.join(process.cwd(), "./uploads") });
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
    WebConnector.prototype.getApp = function () {
        return this.app;
    };
    WebConnector.prototype.getFloodway = function () {
        return this.floodway;
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
        var params = _.extend(req.body, req.params, req.query, { file: req.file });
        console.log(req.file);
        var ssid;
        if (req.cookies["flood-ssid"] == null) {
            ssid = __entry_1.Utils.generateUUID();
            res.cookie("flood-ssid", ssid, { httpOnly: true, expires: new Date(Date.now() + 900000) });
        }
        else {
            ssid = req.cookies["flood-ssid"];
        }
        if (WebAction_1.WebAction.isWebAction(action)) {
            action.populate({
                namespace: namespace.getName(),
                params: params,
                requestId: "web:" + __entry_1.Utils.generateUUID(),
                sessionId: ssid,
                sendData: function (data) {
                    if (DownloadAction_1.DownloadAction.isDownloadAction(action)) {
                        console.log(data.params.path);
                        if (data.messageType == "response" && fs.existsSync(data.params.path)) {
                            res.sendFile(data.params.path);
                        }
                        else if (data.messageType == "error") {
                            res.status(500).end(JSON.stringify(data));
                        }
                        else {
                            res.status(404).end("Error 404. Not found");
                        }
                    }
                    else {
                        res.json(data);
                    }
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
        this.floodway = floodway;
        var namespaces = floodway.getNamespaces();
        for (var _i = 0, _a = Object.keys(namespaces); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var namespace = namespaces[name_1];
            var nsRouter = express.Router();
            for (var _b = 0, _c = Object.keys(namespace.getActions()); _b < _c.length; _b++) {
                var actionName = _c[_b];
                var actionI = namespace.getAction(actionName);
                var action = new actionI();
                if (WebAction_1.WebAction.isWebAction(action)) {
                    var router = action.useNamespaceRouter() ? nsRouter : this.app;
                    for (var _d = 0, _e = action.getHttpMethods(); _d < _e.length; _d++) {
                        var method = _e[_d];
                        var url = action.getUrl();
                        var bodyMode = action.getBodyMode();
                        var useMulter = action.allowUploads();
                        if (bodyMode == BodyMode_1.BodyMode.JSON && useMulter) {
                            throw new Error("Can not combine JSON Mode with uploads");
                        }
                        var args = [url];
                        if (useMulter) {
                            args.push(upload.single("file"));
                            console.log("Applied Multer");
                        }
                        else {
                            if (bodyMode == BodyMode_1.BodyMode.JSON) {
                                args.push(bodyParser.json());
                            }
                            else {
                                args.push(bodyParser.urlencoded({ extended: false }));
                            }
                        }
                        args.push(this.handleRequest.bind(this, namespace, actionI));
                        switch (method) {
                            case HttpMethod_1.HttpMethod.GET:
                                router.get.apply(router, args);
                                break;
                            case HttpMethod_1.HttpMethod.POST:
                                router.post.apply(router, args);
                                break;
                            case HttpMethod_1.HttpMethod.HEAD:
                                router.head.apply(router, args);
                                break;
                            case HttpMethod_1.HttpMethod.PATCH:
                                router.patch.apply(router, args);
                                break;
                            case HttpMethod_1.HttpMethod.DELETE:
                                router.delete.apply(router, args);
                                break;
                        }
                    }
                }
            }
            this.app.use(namespace.getRootUrl(), nsRouter);
        }
        this.server.listen(this.config.port);
    };
    return WebConnector;
}(__entry_1.Connector));
exports.WebConnector = WebConnector;
