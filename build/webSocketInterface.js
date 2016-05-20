var EventEmitter, Request, WebSocketInterface, WsServer, cookie, l,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WsServer = require("ws").Server;

EventEmitter = require("events").EventEmitter;

cookie = require("cookie");

l = require("./log");

Request = require("./request");


/*
  Websocket Interface 
  
  this interface can be used to connect via websockets to Floodway
  
  - Supports updates: yes 
  
  Request schema: 
  
  {
    messageType: "request"
    requestId: "uniqueString"
    params: {...} 
    namespace: "someNamespace" 
    action: "someAction" 
  }
  
  Cancel a request:
  
  {
    messageType: "cancelRequest"
    requestId: "something"
  }
  
  Server replies with:
  
  {
    messageType: "response"
    requestId: "uniqueString"
    data: { ... }
  }
  
  or 
  {
    messageType: "error"
    requestId: "uniqueString"
    error: {
        errorCode: "someErrorCode"
        ...other data...
    }
  }

  or

  {
    messageType: "done"
    requestId: "uniqueString"
  }

  Is sent after a message fails or is marked as done
 */

WebSocketInterface = (function(superClass) {
  extend(WebSocketInterface, superClass);

  function WebSocketInterface(config) {
    var that;
    this.config = config;
    this.handleConnection = bind(this.handleConnection, this);
    this.verifyClient = bind(this.verifyClient, this);
    this.connections = [];
    l.log("Starting Websocket Interface");
    if (this.config.server != null) {
      l.log("Using HTTP server");
      that = this;
      this.server = new WsServer({
        server: this.config.server,
        verifyClient: function(i, c) {
          return that.verifyClient(i, c);
        }
      });
    } else {
      l.log("Using standalone websocket server");
      this.server = new WsServer({
        port: this.config.port,
        verifyClient: function(i, c) {
          return that.verifyClient(i, c);
        }
      });
    }
    this.processor = this.config.processor;
    this.server.on("connection", this.handleConnection);
  }

  WebSocketInterface.prototype.verifyClient = function(info, callback) {
    var cookies;
    if (info.req.headers["cookie"] != null) {
      cookies = cookie.parse(info.req.headers.cookie);
      if ((cookies["flood-ssid"] != null) && cookies["flood-ssid"].length === 36) {
        if (this.config.allowedOrigins.length === 0 || this.config.allowedOrigins[0] === "*") {
          return callback(true);
        } else {
          if (this.config.allowedOrigins.indexOf(info.origin) !== -1) {
            return callback(true);
          }
        }
      }
    }
    return callback(false, 403, "requiresSessionId");
  };

  WebSocketInterface.prototype.handleConnection = function(connection) {
    var requests, ssid;
    ssid = cookie.parse(connection.upgradeReq.headers.cookie)["flood-ssid"];
    requests = [];
    connection.on("close", (function(_this) {
      return function() {
        var j, len, request;
        for (j = 0, len = requests.length; j < len; j++) {
          request = requests[j];
          if (request != null) {
            request.emit("done");
          }
        }
        return requests = [];
      };
    })(this));
    return connection.on("message", (function(_this) {
      return function(message) {
        var data, e, error, item, j, len, request, requestsFiltered, results;
        try {
          data = JSON.parse(message.toString());
        } catch (error) {
          e = error;
          l.error("Invalid message: " + e);
        }
        if (data != null) {
          if ((data.requestId != null) && (data.messageType != null)) {
            switch (data.messageType) {
              case "request":
                request = new Request({
                  namespace: data.namespace,
                  action: data.action,
                  params: data.params,
                  session: ssid,
                  supportsUpdates: true,
                  sendData: function(toBeSent) {
                    var error1;
                    toBeSent.requestId = data.requestId;
                    try {
                      return connection.send(JSON.stringify(toBeSent));
                    } catch (error1) {
                      e = error1;
                      return l.error("Error while sending data back to client: " + e);
                    }
                  }
                });
                request.requestId = data.requestId;
                requests.push(request);
                _this.processor.processRequest(request);
                return request.once("done", function() {
                  return requests.splice(requests.indexOf(request), 1);
                });
              case "cancelRequest":
                requestsFiltered = requests.filter(function(item) {
                  return item.requestId === data.requestId;
                });
                if (requestsFiltered.length !== 0) {
                  results = [];
                  for (j = 0, len = requestsFiltered.length; j < len; j++) {
                    item = requestsFiltered[j];
                    results.push(item.emit("done"));
                  }
                  return results;
                }
                break;
              default:
                return connection.send(JSON.stringify({
                  messageType: "error",
                  requestId: data.requestId,
                  error: {
                    errorCode: "invalidMessageType"
                  }
                }));
            }
          }
        }
      };
    })(this));
  };

  WebSocketInterface.prototype.getServer = function() {
    return this.server;
  };

  return WebSocketInterface;

})(EventEmitter);

module.exports = WebSocketInterface;
