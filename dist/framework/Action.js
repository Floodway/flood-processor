"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var events_1 = require("events");
var flood_gate_1 = require("flood-gate");
var defaultErrors = [
    {
        errorCode: "internalError",
        description: "An internal error occured while processing the request"
    },
    {
        errorCode: "invalidParams",
        description: "The parameters passed to the action where not compatible with it or the defined middleware"
    },
    {
        errorCode: "invalidResult",
        description: "The result of this action was not valid."
    }
];
var Action = (function (_super) {
    __extends(Action, _super);
    function Action() {
        _super.call(this);
    }
    Action.prototype.toJson = function () {
        return {
            name: this.getName(),
            description: this.getDescription(),
            middleware: this.getAllMiddleware().map(function (middleware) { return middleware.toJSON(); }),
            errors: this.getPossibleErrors()
        };
    };
    Action.prototype.getNamespace = function () { return this.namespace; };
    Action.prototype.setNamespace = function (namespace) {
        this.namespace = namespace;
    };
    Action.prototype.getRequestId = function () { return this.requestId; };
    Action.prototype.getRedis = function () { return this.redis; };
    Action.prototype.getMiddleware = function () {
        return [];
    };
    Action.prototype.ignoreNamespaceMiddleware = function () { return false; };
    Action.prototype.getParams = function () { return this.params; };
    Action.prototype.getErrors = function () { return []; };
    Action.prototype.supportsUpdates = function () {
        return false;
    };
    Action.prototype.getGroup = function () {
        return null;
    };
    Action.prototype.setParams = function (params) {
        this.params = flood_gate_1.SchemaStore.populateSchema(this.getParamsClass(), params, this.getGroup());
    };
    Action.prototype.populate = function (params, floodway) {
        this.sendData = params.sendData;
        this.paramsRaw = params.params;
        this.clientTokens = params.clientTokens;
        this.processedMiddleware = -1;
        this.requestId = params.requestId;
        this.namespace = floodway.getNamespace(params.namespace);
        this.redis = params.listensForEvents ? floodway.getRedisEvent() : floodway.getRedis();
        if (this.getAllMiddleware().length != 0) {
            this.nextMiddleware();
        }
        else {
            this.execute();
        }
    };
    Action.prototype.getAllMiddleware = function () {
        var middleware = [];
        if (!this.ignoreNamespaceMiddleware()) {
            middleware = middleware.concat(this.getNamespace().getMiddleware());
        }
        middleware = middleware.concat(this.getMiddleware());
        return middleware;
    };
    Action.prototype.getPossibleErrors = function () {
        var middlewareErrors = [];
        this.getAllMiddleware().map(function (middleware) {
            middlewareErrors = middlewareErrors.concat(middleware.getErrors().map(function (err) { err.source = middleware.getName(); return err; }));
        });
        return defaultErrors.concat(this.getErrors()).concat(middlewareErrors);
    };
    Action.prototype.execute = function () {
        var _this = this;
        flood_gate_1.SchemaStore.validate(this.params, function (err, res) {
            _this.params = res;
            if (err != null) {
                return _this.fail("invalidParams", JSON.stringify(err));
            }
            _this.run();
        });
    };
    Action.prototype.nextMiddleware = function () {
        this.processedMiddleware++;
        if (this.processedMiddleware == this.getAllMiddleware().length) {
            this.execute();
        }
        else {
            this.getAllMiddleware()[this.processedMiddleware].execute(this);
        }
    };
    Action.prototype.done = function () {
        this.emit("done");
    };
    Action.prototype.res = function (data, final) {
        var _this = this;
        if (final === void 0) { final = false; }
        flood_gate_1.SchemaStore.validate(data, function (err, res) {
            if (err != null) {
                _this.fail("invalidResult", err);
            }
            else {
                _this.sendData({
                    messageType: "response",
                    requestId: _this.requestId,
                    params: res
                });
            }
        });
        if (!this.supportsUpdates() || final) {
            this.emit("done");
        }
    };
    Action.prototype.fail = function (errorCode, additionalData) {
        var possibleErrors = this.getPossibleErrors();
        var filtered = possibleErrors.filter(function (err) {
            return err.errorCode == errorCode;
        });
        if (filtered.length >= 1) {
            var err = _.extend({}, filtered[0], { additionalData: additionalData });
            console.error(err);
            this.sendData({
                messageType: "error",
                requestId: this.requestId,
                params: filtered[0]
            });
        }
        else {
            this.sendData({
                messageType: "error",
                requestId: this.requestId,
                params: {
                    errorCode: "internalError",
                    description: "The provided error is non-existent"
                }
            });
            console.error("Could not fail properly. " + errorCode + " is not defined. ");
        }
        this.emit("done");
    };
    return Action;
}(events_1.EventEmitter));
exports.Action = Action;
