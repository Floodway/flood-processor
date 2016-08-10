"use strict";
var uuid = require("node-uuid");
var Utils = (function () {
    function Utils() {
    }
    Utils.generateUUID = function () {
        return uuid.v4().toString();
    };
    return Utils;
}());
exports.Utils = Utils;
