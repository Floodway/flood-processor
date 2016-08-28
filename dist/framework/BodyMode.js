"use strict";
(function (BodyMode) {
    BodyMode[BodyMode["JSON"] = 0] = "JSON";
    BodyMode[BodyMode["UrlEncoded"] = 1] = "UrlEncoded";
    BodyMode[BodyMode["Upload"] = 2] = "Upload";
})(exports.BodyMode || (exports.BodyMode = {}));
var BodyMode = exports.BodyMode;
