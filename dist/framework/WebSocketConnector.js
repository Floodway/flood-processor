"use strict";
var __entry_1 = require("../__entry");
var ws_1 = require("ws");
var DownloadAction_1 = require("./DownloadAction");
var WebSocketConnection = (function () {
    function WebSocketConnection() {
    }
    return WebSocketConnection;
}());
exports.WebSocketConnection = WebSocketConnection;
var WebSocketConnector = (function () {
    function WebSocketConnector(config) {
        this.l = new __entry_1.Log("WebSocketConector");
        this.config = config;
    }
    WebSocketConnector.prototype.start = function (floodway) {
        this.floodway = floodway;
        if (this.config.server == null) {
            this.l.debug("Using separate Server on port " + this.config.port + ".");
            this.server = new ws_1.Server({
                port: this.config.port,
                verifyClient: this.verifyClient
            });
        }
        else {
            this.l.debug("Using already created web-server on port " + this.config.server.localPort);
            this.server = new ws_1.Server({
                server: this.config.server,
                verifyClient: this.verifyClient.bind(this)
            });
        }
        this.connections = [];
        this.server.on("connection", this.handleConnection.bind(this));
    };
    WebSocketConnector.prototype.getMeta = function () {
        return {
            name: "WebSocketConnector",
            additionalData: {
                port: this.config.port,
                usingServer: this.config.server != null,
                allowedOrigins: this.config.allowedOrigins
            }
        };
    };
    WebSocketConnector.prototype.handleConnection = function (socket) {
        var _this = this;
        var connection = {
            socket: socket
        };
        var ssid = __entry_1.Cookie.parse(socket.upgradeReq.headers.cookie)["flood-ssid"];
        this.connections.push(connection);
        var clientId;
        var requests = [];
        socket.on("close", function () {
            for (var _i = 0, requests_1 = requests; _i < requests_1.length; _i++) {
                var request = requests_1[_i];
                if (request != null) {
                    request.done();
                }
            }
            requests = [];
            _this.connections = _this.connections.filter(function (item) {
                return item != connection;
            });
        });
        socket.on("message", function (message) {
            try {
                var data = JSON.parse(message.toString());
            }
            catch (error) {
                _this.l.debug("Invalid message: " + error);
            }
            if (data != null) {
                if (data.requestId != null && data.messageType != null) {
                    switch (data.messageType) {
                        case "request":
                            if (_this.floodway.namespaceExists(data.params.namespace)) {
                                var namespace = _this.floodway.getNamespaces()[data.params.namespace];
                                if (namespace.hasAction(data.params.action)) {
                                    var ActionI = namespace.getAction(data.params.action);
                                    var action_1 = new ActionI();
                                    if (DownloadAction_1.DownloadAction.isDownloadAction(action_1)) {
                                        return socket.send(JSON.stringify({
                                            messageType: "error",
                                            requestId: data.requestId,
                                            params: {
                                                errorCode: "unknownAction",
                                                description: "The action  " + data.params.action + " does not exist!"
                                            }
                                        }));
                                    }
                                    if (data.params.params == null) {
                                        data.params.params = {};
                                    }
                                    action_1.populate({
                                        params: data.params.params,
                                        namespace: namespace.getName(),
                                        requestId: data.requestId,
                                        sessionId: ssid,
                                        sendData: function (data) {
                                            socket.send(JSON.stringify(data));
                                        }
                                    }, _this.floodway);
                                    requests.push(action_1);
                                    action_1.once("done", function () {
                                        try {
                                            socket.send(JSON.stringify({
                                                messageType: "done",
                                                requestId: data.requestId
                                            }));
                                        }
                                        catch (e) {
                                        }
                                        requests = requests.filter(function (item) {
                                            return item.requestId != action_1.requestId;
                                        });
                                    });
                                }
                                else {
                                    socket.send(JSON.stringify({
                                        messageType: "error",
                                        requestId: data.requestId,
                                        params: {
                                            errorCode: "unknownAction",
                                            description: "The action  " + data.params.action + " does not exist!"
                                        }
                                    }));
                                }
                            }
                            else {
                                socket.send(JSON.stringify({
                                    messageType: "error",
                                    requestId: data.requestId,
                                    params: {
                                        errorCode: "unknownNamespace",
                                        description: "The namespace  " + data.params.namespace + " does not exist!"
                                    }
                                }));
                            }
                            break;
                        case "cancelRequest":
                            var requestsFiltered = requests.filter(function (req) {
                                return req.requestId == data.requestId;
                            });
                            for (var _i = 0, requestsFiltered_1 = requestsFiltered; _i < requestsFiltered_1.length; _i++) {
                                var item = requestsFiltered_1[_i];
                                item.emit("done");
                            }
                            break;
                        default:
                            socket.send(JSON.stringify({
                                messageType: "error",
                                requestId: data.requestId,
                                params: {
                                    errorCode: "invalidMessageType"
                                }
                            }));
                            break;
                    }
                }
            }
        });
    };
    WebSocketConnector.prototype.verifyClient = function (info) {
        if (info.req.headers.hasOwnProperty("cookie")) {
            var cookies = __entry_1.Cookie.parse(info.req.headers.cookie);
            if (cookies["flood-ssid"] != null &&
                cookies["flood-ssid"].length == 36) {
                if (this.config.allowedOrigins.length == 0 || this.config.allowedOrigins.indexOf("*") != -1) {
                    return true;
                }
                if (this.config.allowedOrigins.indexOf(info.origin) != -1) {
                    return true;
                }
            }
        }
        return false;
    };
    return WebSocketConnector;
}());
exports.WebSocketConnector = WebSocketConnector;
