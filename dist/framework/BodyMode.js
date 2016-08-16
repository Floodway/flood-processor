"use strict";
(function (BodyMode) {
    BodyMode[BodyMode["JSON"] = 0] = "JSON";
    BodyMode[BodyMode["UrlEncoded"] = 1] = "UrlEncoded";
})(exports.BodyMode || (exports.BodyMode = {}));
var BodyMode = exports.BodyMode;
