"use strict";
var __entry_1 = require("../__entry");
var redis = require("redis");
var path = require("path");
var Floodway = (function () {
    function Floodway() {
        this.namespaces = {};
        this.connectors = [];
        this.logger = new __entry_1.Log("Floodway");
        this.logger.success("Starting a new Floodway instance version " + require(path.join(process.cwd(), "./package.json"))["version"]);
    }
    Floodway.prototype.start = function () {
        var _this = this;
        this.connectToRedis();
        this.connectors.forEach(function (connector) {
            connector.start(_this);
        });
        Object.keys(this.namespaces).forEach(function (namespaceKey) {
            _this.namespaces[namespaceKey].start(_this);
        });
        this.running = true;
    };
    Floodway.prototype.connectToRedis = function () {
        this.redisClient = redis.createClient();
    };
    Floodway.prototype.getRedisEvent = function () {
        return redis.createClient();
    };
    Floodway.prototype.getConnectors = function () {
        return this.connectors;
    };
    Floodway.prototype.getRedis = function () {
        return this.redisClient;
    };
    Floodway.prototype.getNamespace = function (name) {
        return this.namespaces[name];
    };
    Floodway.prototype.namespaceExists = function (name) {
        return this.namespaces[name] != null;
    };
    Floodway.prototype.getNamespaces = function () {
        return this.namespaces;
    };
    Floodway.prototype.registerNamespace = function (namespace) {
        if (this.running) {
            console.error("Could not add namespace. The system is already running.");
        }
        if (this.namespaceExists(namespace.getName())) {
            throw Error("Unable to register namespace with name  " + namespace.getName() + ". A namespace with this name already exists.");
        }
        else {
            this.namespaces[namespace.getName()] = namespace;
        }
    };
    Floodway.prototype.registerConnector = function (connector) {
        this.connectors.push(connector);
    };
    return Floodway;
}());
exports.Floodway = Floodway;
