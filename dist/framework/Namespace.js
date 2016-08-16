"use strict";
var Namespace = (function () {
    function Namespace() {
        this.actions = {};
    }
    Namespace.prototype.getMiddleware = function () {
        return [];
    };
    Namespace.prototype.start = function (instance) {
    };
    Namespace.prototype.getRootUrl = function () {
        return "/" + this.getName();
    };
    Namespace.prototype.getActions = function () { return this.actions; };
    Namespace.prototype.getAction = function (name) { return this.actions[name]; };
    Namespace.prototype.hasAction = function (name) { return this.actions[name] != null; };
    Namespace.prototype.action = function (action) {
        var temp = new action();
        this.actions[temp.getMetaData().name] = action;
    };
    return Namespace;
}());
exports.Namespace = Namespace;
