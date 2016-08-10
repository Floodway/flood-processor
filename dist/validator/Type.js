"use strict";
var Type = (function () {
    function Type() {
        this.isBuiltB = false;
    }
    Type.prototype.isBuilt = function () {
        return this.isBuiltB;
    };
    Type.prototype.build = function (path) {
        if (path === void 0) { path = "root"; }
        this.path = path;
        this.isBuiltB = true;
        return this;
    };
    Type.prototype.getDefault = function () {
        return null;
    };
    return Type;
}());
exports.Type = Type;
