#!/usr/bin/env node
"use strict";
var fs = require("fs");
var path = require("path");
var __entry_1 = require("../__entry");
function isWebAction(action) {
    return action.getWebConfig !== undefined;
}
function isAction(action) {
    return action.getMetaData !== undefined;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (main, packageJson, writeToFile) {
    if (writeToFile === void 0) { writeToFile = false; }
    if (main != null) {
        if (main.getNamespaces != null) {
            var namespaces = main.getNamespaces();
            var namespaceResult = [];
            for (var _i = 0, _a = Object.keys(namespaces); _i < _a.length; _i++) {
                var namespaceName = _a[_i];
                var namespace = namespaces[namespaceName];
                var actions = [];
                var _loop_1 = function(key) {
                    var actionI = namespace.getActions()[key];
                    var action = new actionI();
                    var meta = void 0;
                    var webStuff = void 0;
                    if (isAction(action)) {
                        meta = action.getMetaData();
                    }
                    if (isWebAction(action)) {
                        var webConfig = action.getWebConfig();
                        var res_1 = {
                            methods: [],
                            path: webConfig.url,
                            bodyMode: webConfig.bodyMode == __entry_1.BodyMode.JSON ? "JSON" : "UrlEncoded"
                        };
                        webConfig.methods.map(function (method) {
                            switch (method) {
                                case __entry_1.HttpMethod.DELETE:
                                    res_1.methods.push("DELETE");
                                    break;
                                case __entry_1.HttpMethod.GET:
                                    res_1.methods.push("GET");
                                    break;
                                case __entry_1.HttpMethod.PATCH:
                                    res_1.methods.push("PATH");
                                    break;
                                case __entry_1.HttpMethod.POST:
                                    res_1.methods.push("POST");
                                    break;
                                case __entry_1.HttpMethod.HEAD:
                                    res_1.methods.push("HEAD");
                                    break;
                            }
                        });
                        webStuff = res_1;
                    }
                    if (isAction(action)) {
                        actions.push({
                            name: meta.name,
                            description: meta.description,
                            middleware: meta.middleware.map(function (item) {
                                var res = item.getMetaData();
                                res.params = {
                                    schema: res.params.toJSON(),
                                    name: item.getParamsName()
                                };
                                return res;
                            }),
                            possibleErrors: meta.errors,
                            supportsUpdates: meta.supportsUpdates,
                            webConfig: webStuff,
                            params: {
                                schema: meta.params.toJSON(),
                                name: action.getParamsName()
                            },
                            result: {
                                schema: meta.result.toJSON(),
                                name: action.getResultName()
                            }
                        });
                    }
                };
                for (var _b = 0, _c = Object.keys(namespace.getActions()); _b < _c.length; _b++) {
                    var key = _c[_b];
                    _loop_1(key);
                }
                namespaceResult.push({
                    name: namespace.getName(),
                    middleware: namespace.getMiddleware().map(function (item) {
                        var res = item.getMetaData();
                        res.params = {
                            schema: res.params.toJSON(),
                            name: item.getParamsName()
                        };
                        return res;
                    }),
                    actions: actions,
                });
            }
            var result = {
                version: packageJson.version,
                connectors: main.getConnectors().map(function (item) { return item.getMeta(); }),
                applicationConfig: packageJson.floodConfig,
                namespaces: namespaceResult,
            };
            if (writeToFile == true) {
                fs.writeFileSync(path.join(process.cwd(), "./config.json"), JSON.stringify(result));
            }
            return JSON.stringify(result);
        }
    }
};
