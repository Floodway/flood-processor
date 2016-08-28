"use strict";
var fs = require("fs");
var path = require("path");
var HttpMethod_1 = require("../framework/HttpMethod");
function makeClassName(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}
exports.getDirectories = getDirectories;
function httpMethodToString(method) {
    switch (method) {
        case HttpMethod_1.HttpMethod.DELETE:
            return "DELETE";
        case HttpMethod_1.HttpMethod.GET:
            return "GET";
        case HttpMethod_1.HttpMethod.PATCH:
            return "PATCH";
        case HttpMethod_1.HttpMethod.POST:
            return "POST";
        case HttpMethod_1.HttpMethod.HEAD:
            return "HEAD";
        default:
            return "UNKNOWN";
    }
}
exports.httpMethodToString = httpMethodToString;
