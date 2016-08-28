"use strict";
var ClientTokens = (function () {
    function ClientTokens(tokens) {
        this.tokens = tokens;
        this.setTokens = {};
    }
    ClientTokens.prototype.setToken = function (name, token) {
        this.tokens[name] = token;
        this.setTokens[name] = token;
    };
    ClientTokens.prototype.getToken = function (name) {
        return this.tokens[name];
    };
    return ClientTokens;
}());
exports.ClientTokens = ClientTokens;
