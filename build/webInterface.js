var EventEmitter, Request, WebInterface, cookie, http, l, url, utils, uuid,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

http = require("http");

cookie = require("cookie");

utils = require("./utils");

l = require("./log");

url = require("url");

Request = require("./request");

uuid = require("node-uuid");


/*

  WebInterface

  - Supports updates: false
 */

WebInterface = (function(superClass) {
  extend(WebInterface, superClass);

  function WebInterface(port, processor) {
    this.port = port;
    this.processor = processor;
    this.handleRequest = bind(this.handleRequest, this);
    this.requests = [];
    this.server = http.createServer(this.handleRequest);
  }

  WebInterface.prototype.getServer = function() {
    return this.server;
  };

  WebInterface.prototype.listen = function() {
    return this.server.listen(this.port);
  };

  WebInterface.prototype.handleRequest = function(req, res) {
    var body;
    body = "";
    req.on("data", function(chunk) {
      return body += chunk.toString();
    });
    return req.on("end", (function(_this) {
      return function() {
        var action, cookies, e, error, location, namespace, params, request, split, ssid;
        if (body.length !== 0) {
          try {
            params = JSON.parse(body);
          } catch (error) {
            e = error;
            l.error(e);
          }
        }
        if (params == null) {
          return res.end(JSON.stringify({
            messageType: "error",
            error: {
              errorCode: "noParameters"
            }
          }));
        }
        if (req.headers.cookie != null) {
          cookies = cookie.parse(req.headers.cookie);
          if ((cookies["flood-ssid"] != null) && cookies["flood-ssid"].length === 36) {
            ssid = cookies["flood-ssid"];
          }
        }
        console.log(ssid);
        if (ssid == null) {
          ssid = uuid.v4();
          res.setHeader("Set-Cookie", ["flood-ssid=" + ssid + ";Max-Age=" + 2592000. + ";HttpOnly"]);
        }
        location = url.parse(req.url, true);
        split = location.pathname.split("/");
        split.shift();
        if (split.length !== 2) {
          l.error("Invalid url: " + split);
          return res.end(JSON.stringify({
            messageType: "error",
            error: {
              errorCode: "invalidRequest"
            }
          }));
        }
        namespace = split[0];
        action = split[1];
        request = new Request({
          namespace: namespace,
          action: action,
          params: params,
          session: ssid,
          supportsUpdates: false,
          sendData: function(data) {
            var error1;
            try {
              return res.end(JSON.stringify(data));
            } catch (error1) {
              e = error1;
              return l.error("Error while sending data back to client: " + e);
            }
          }
        });
        _this.requests.push(request);
        _this.processor.processRequest(request);
        request.once("done", function() {
          return _this.requests.splice(_this.requests.indexOf(request), 1);
        });
        return req.once("close", function() {
          return request.emit("done");
        });
      };
    })(this));
  };

  return WebInterface;

})(EventEmitter);

module.exports = WebInterface;
