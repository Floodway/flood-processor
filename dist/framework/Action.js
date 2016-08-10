"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var events_1 = require("events");
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
    Action.prototype.makeClassName = function (input) {
        return input.charAt(0).toUpperCase() + input.slice(1);
    };
    Action.prototype.getParamsName = function () {
        if (!this.getMetaData().params.isBuilt()) {
            return this.makeClassName(this.getMetaData().name) + "Params";
        }
        else {
            return this.getMetaData().params.path;
        }
    };
    Action.prototype.getResultName = function () {
        if (!this.getMetaData().result.isBuilt()) {
            return this.makeClassName(this.getMetaData().name) + "Result";
        }
        else {
            return this.getMetaData().result.path;
        }
    };
    Action.prototype.populate = function (params, floodway) {
        this.sendData = params.sendData;
        this.params = params.params;
        this.sessionId = params.sessionId;
        this.processedMiddleware = -1;
        this.requestId = params.requestId;
        this.namespace = floodway.getNamespace(params.namespace);
        this.middleware = this.namespace.getMiddleware().concat(this.getMetaData().middleware);
        this.redis = params.listensForEvents ? floodway.getRedisEvent() : floodway.getRedis();
        if (this.middleware.length != 0) {
            this.nextMiddleware();
        }
        else {
            this.execute();
        }
    };
    Action.prototype.getPossibleErrors = function () {
        var middlewareErrors = [];
        this.middleware.map(function (middleware) {
            var errs = middleware.getMetaData().errors.map(function (err) {
                err.source = middleware.getMetaData().name;
                return err;
            });
            middlewareErrors = middlewareErrors.concat(errs);
        });
        return defaultErrors.concat(this.getMetaData().errors).concat(middlewareErrors);
    };
    Action.prototype.execute = function () {
        var _this = this;
        this.getMetaData().params.validate(this.params, function (err, result) {
            if (err != null) {
                _this.fail("invalidParams", err);
            }
            else {
                _this.params = result;
                _this.run();
            }
        });
    };
    Action.prototype.nextMiddleware = function () {
        this.processedMiddleware++;
        if (this.processedMiddleware == this.middleware.length) {
            this.execute();
        }
        else {
            this.middleware[this.processedMiddleware].execute(this);
        }
    };
    Action.prototype.done = function () {
        this.emit("done");
    };
    Action.prototype.res = function (data, final) {
        var _this = this;
        if (final === void 0) { final = false; }
        this.getMetaData().result.validate(data, function (err, res) {
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
            if (!_this.getMetaData().supportsUpdates || final) {
                _this.emit("done");
            }
        });
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
