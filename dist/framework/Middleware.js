"use strict";
var Middleware = (function () {
    function Middleware() {
    }
    Middleware.prototype.getParamsName = function () {
        if (this.getMetaData().params.isBuilt()) {
            return this.getMetaData().params.path;
        }
        else {
            return this.makeClassName(this.getMetaData().name) + "Params";
        }
    };
    Middleware.prototype.makeClassName = function (input) {
        return input.charAt(0).toUpperCase + input.slice(1);
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
            console.error("FATAL: Middleware " + this.getMetaData().name + " called next twice! THIS IS A NOGO!");
        }
    };
    Middleware.prototype.execute = function (action) {
        var _this = this;
        this.action = action;
        this.getMetaData().params.validate(action.params, function (err, newParams) {
            if (err == null) {
                action.params = newParams;
                _this.run(action);
            }
            else {
                console.log(_this.getMetaData().params.toJSON());
                action.fail("invalidParams", err);
            }
        });
    };
    return Middleware;
}());
exports.Middleware = Middleware;
