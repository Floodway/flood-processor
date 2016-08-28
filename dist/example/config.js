"use strict";
var FloodConfig_1 = require("../framework/FloodConfig");
var config = {
    floodway: {
        debugLevel: FloodConfig_1.DebugLevel.NORMAL
    },
    connectors: {
        ws: {
            port: null,
            useWebServer: true,
        },
        http: {
            port: 4040,
        }
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = config;
