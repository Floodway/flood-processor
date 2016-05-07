var EventEmitter, Request, Session, WebInterface, _, cookie, http, l, url, utils,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

http = require("http");

cookie = require("cookie");

utils = require("./utils");

l = require("./log");

Session = require("./session");

url = require("url");

_ = require("lodash");

Request = require("./request");

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
        var action, constructRequest, cookies, createSession, e, error, location, name, namespace, params, session, split, ssid, value;
        if (body.length !== 0) {
          try {
            params = JSON.parse(body);
          } catch (error) {
            e = error;
            l.error(e);
          }
        }
        if (params == null) {
          params = {};
        }
        if (req.headers.cookie != null) {
          cookies = cookie.parse(req.headers.cookie);
          for (name in cookies) {
            value = cookies[name];
            if (name === "flood-ssid" && value.length === 36) {
              ssid = value;
            }
          }
        }
        location = url.parse(req.url, true);
        split = location.pathname.split("/");
        split.shift();
        if (split.length !== 2) {
          l.error("Invalid url: " + split);
          return res.end(JSON.stringify({
            messageType: "error",
            error: "invalidRequest"
          }));
        }
        namespace = split[0];
        action = split[1];
        params = _.assign(location.query, params);
        constructRequest = function(session) {
          var request;
          request = new Request({
            namespace: namespace,
            action: action,
            params: params,
            session: session,
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
          return request.on("done", function() {
            return _this.requests.splice(_this.requests.indexOf(request), 1);
          });
        };
        createSession = function() {
          return Session.createSession(this.processor.db, function(err, session) {
            if (err != null) {
              return res.end(JSON.stringify({
                messageType: "error",
                error: "internalError"
              }));
            }
            l.log("Setting header");
            res.setHeader("Set-Cookie", ["flood-ssid=" + session.ssid + ";Max-Age=" + 2592000. + ";HttpOnly"]);
            return constructRequest(session);
          });
        };
        if (ssid == null) {
          return createSession();
        } else {
          session = new Session(ssid, _this.processor.db);
          return session.verify(function(err) {
            if (err != null) {
              return createSession();
            } else {
              return constructRequest(session);
            }
          });
        }
      };
    })(this));
  };

  return WebInterface;

})(EventEmitter);

module.exports = WebInterface;
