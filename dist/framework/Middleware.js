"use strict";
var flood_gate_1 = require("flood-gate");
var Middleware = (function () {
    function Middleware() {
    }
    Middleware.prototype.getErrors = function () {
        return [];
    };
    Middleware.prototype.getMiddleware = function () {
        return [];
    };
    Middleware.prototype.fail = function (errorCode, additionalData) {
        this.action.fail(errorCode, additionalData);
    };
    Middleware.prototype.next = function () {
        if (!this.done) {
            this.action.nextMiddleware();
            this.done = true;
        }
        else {
            console.error("FATAL: Middleware " + this.getName() + " called next twice! THIS IS A NOGO!");
        }
    };
    Middleware.prototype.nextMiddleware = function (action) {
        this.processedMiddleware++;
        if (this.getMiddleware().length == this.processedMiddleware) {
            this.checkParams(action);
        }
        else {
            this.getMiddleware()[this.processedMiddleware].execute(action);
        }
    };
    Middleware.prototype.checkParams = function (action) {
        var _this = this;
        this.params = flood_gate_1.SchemaStore.populateSchema(this.getParamsClass(), action.paramsRaw, this.getGroup());
        flood_gate_1.SchemaStore.validate(this.params, function (err, params) {
            if (err != null) {
                _this.fail("invalidParams", err);
            }
            else {
                console.log(params);
                _this.action.setParams(params);
                _this.params = params;
                _this.run(action);
            }
        });
    };
    Middleware.prototype.getGroup = function () {
        return null;
    };
    Middleware.prototype.toJSON = function () {
        return {
            name: this.getName(),
            description: this.getDescription(),
            params: this.getParamsClass()["name"],
            middleware: this.getMiddleware().map(function (item) { return item.toJSON(); })
        };
    };
    Middleware.prototype.execute = function (action) {
        this.action = action;
        if (this.getMiddleware().length == 0) {
            this.checkParams(action);
        }
        else {
            this.nextMiddleware(action);
        }
    };
    return Middleware;
}());
exports.Middleware = Middleware;
