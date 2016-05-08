var EventEmitter, Request, Session, WebSocketInterface, WsServer, cookie, l,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WsServer = require("ws").Server;

EventEmitter = require("events").EventEmitter;

cookie = require("cookie");

l = require("./log");

Session = require("./session");

Request = require("./request");

WebSocketInterface = (function(superClass) {
  extend(WebSocketInterface, superClass);

  function WebSocketInterface(config) {
    var that;
    this.config = config;
    this.handleConnection = bind(this.handleConnection, this);
    this.verifyClient = bind(this.verifyClient, this);
    l.log("Starting Websocket Interface");
    this.connections = [];
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
            console.log("Valid origin");
            return callback(true);
          }
        }
      }
    }
    return callback(false, 403, "requiresSessionId");
  };

  WebSocketInterface.prototype.handleConnection = function(connection) {
    var session, ssid;
    console.log("Connected...");
    ssid = cookie.parse(connection.upgradeReq.headers.cookie)["flood-ssid"];
    connection.requests = [];
    session = new Session(ssid, this.processor.db);
    return session.verify((function(_this) {
      return function(err) {
        if (err != null) {
          return connection.close(1008);
        } else {
          connection.on("close", function() {
            var j, len, ref, request;
            console.log("Closing..");
            ref = connection.requests;
            for (j = 0, len = ref.length; j < len; j++) {
              request = ref[j];
              request.emit("done");
            }
            return connection.requests = [];
          });
          return connection.on("message", function(message) {
            var data, e, error, item, j, len, request, requests;
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
                      session: session,
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
                    connection.requests.push(request);
                    _this.processor.processRequest(request);
                    return request.on("done", function() {
                      return connection.requests.splice(connection.requests.indexOf(request), 1);
                    });
                  case "cancelRequest":
                    requests = connection.requests.filter(function(item) {
                      return item.requestId === data.params.requestId;
                    });
                    if (requests.length !== 0) {
                      for (j = 0, len = requests.length; j < len; j++) {
                        item = requests[j];
                        item.emit("done");
                      }
                      return connection.send(JSON.stringify({
                        messageType: "response",
                        requestId: data.requestId,
                        data: {
                          terminatedRequests: requests.length
                        }
                      }));
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
          });
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
