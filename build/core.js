var EventEmitter, FloodProcessor, RequestEventEmitter, WebInterface, WebSocket, WebSocketInterface, _, fs, l, r, validator,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WebSocket = require("ws");

EventEmitter = require("events").EventEmitter;

RequestEventEmitter = require("./requestEventEmitter");

r = require("rethinkdb");

validator = require("flood-gate");

l = require("./log");

_ = require("lodash");

fs = require("fs");

WebInterface = require("./webInterface");

WebSocketInterface = require("./webSocketInterface");

FloodProcessor = (function(superClass) {
  extend(FloodProcessor, superClass);

  FloodProcessor.CrudNamespace = require("./crudNamespace");

  FloodProcessor.prototype.isFloodProcessor = function() {
    return true;
  };

  function FloodProcessor(config) {
    this.nextMiddleware = bind(this.nextMiddleware, this);
    var ref, ref1, ref2;
    this.namespaces = {};
    this.listeners = [];
    this.config = {
      db: (ref = config.db) != null ? ref : {
        db: "floodway"
      },
      eventServer: (ref1 = config.eventServer) != null ? ref1 : {
        ip: "localhost",
        useWss: false,
        port: 3000
      },
      interfaces: (ref2 = config.interfaces) != null ? ref2 : {
        http: {
          enabled: true,
          port: 4080
        },
        ws: {
          enabled: true,
          allowedOrigins: ["*"],
          port: null,
          useHtttp: true
        }
      }
    };
    this.namespace(require("./mainNamespace"));
    this.validateIntegrity();
  }

  FloodProcessor.prototype.connectToDb = function(callback) {
    return r.connect(this.config.db, (function(_this) {
      return function(err, conn) {
        if (err != null) {
          _this.shutdown("Db Connection failed: " + err);
        }
        _this.db = conn;
        _this.checkDb();
        return callback();
      };
    })(this));
  };

  FloodProcessor.prototype.checkDb = function() {
    l.log("Checking database compatibility");
    return r.dbList().run(this.db, (function(_this) {
      return function(err, dbs) {
        var checkTables;
        checkTables = function() {
          return r.db(_this.config.db.db).tableList().run(_this.db, function(err, res) {
            var j, len, requiredTables, results, table;
            if (err != null) {
              _this.shutdown("Database not compatible: " + err);
            }
            requiredTables = ["sessions"];
            results = [];
            for (j = 0, len = requiredTables.length; j < len; j++) {
              table = requiredTables[j];
              if (res.indexOf(table) === -1) {
                l.success("Creating Table: " + table);
                results.push(r.db(_this.config.db.db).tableCreate(table).run(_this.db));
              } else {
                results.push(void 0);
              }
            }
            return results;
          });
        };
        if (dbs.indexOf(_this.config.db.db) === -1) {
          return r.dbCreate(_this.config.db.db).run(_this.db, function(err) {
            if (err != null) {
              return _this.shutdown("Database not compatible: " + err);
            } else {
              return checkTables();
            }
          });
        } else {
          return checkTables();
        }
      };
    })(this));
  };

  FloodProcessor.prototype.emitEvent = function(name, params) {
    var j, len, listener, ref, results;
    this.eventSocket.send(JSON.stringify({
      messageType: "event",
      params: {
        event: name,
        params: params
      }
    }));
    l.log("Sending event: " + name);
    ref = this.listeners;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      listener = ref[j];
      results.push((function(listener) {
        return listener.emitEvent(name, params);
      })(listener));
    }
    return results;
  };

  FloodProcessor.prototype.processEventMessage = function(data) {
    var j, len, listener, ref, results;
    if ((data.messageType != null) && (data.params != null)) {
      switch (data.messageType) {
        case "event":
          ref = this.listeners;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            listener = ref[j];
            results.push(listener.emitEvent(data.params.event, data.params.params));
          }
          return results;
          break;
        default:
          return l.error("Invalid messageType received: " + data.messageType);
      }
    } else {
      return l.error("Invalid message received: " + data);
    }
  };

  FloodProcessor.prototype.shutdown = function(reason) {
    throw new Error(reason);
  };

  FloodProcessor.prototype.sendEvent = function(data) {
    return this.eventSocket.send(JSON.stringify(data));
  };

  FloodProcessor.prototype.namespace = function(namespace) {
    var action, middleware, name, ref, ref1;
    if (namespace.namespace == null) {
      this.shutdown("No namespace provided");
    }
    if (this.namespaces[namespace.namespace] != null) {
      this.shutdown("Duplicate namespace used");
    }
    if (namespace.actions == null) {
      namespace.actions = {};
    }
    if (namespace.middleware == null) {
      namespace.middleware = {};
    }
    if (namespace.globalMiddleware == null) {
      namespace.globalMiddleware = [];
    }
    ref = namespace.middleware;
    for (name in ref) {
      middleware = ref[name];
      if (!middleware.description) {
        this.shutdown("No description for middleware: " + name);
      }
      if (middleware.params == null) {
        middleware.params = {};
      }
    }
    ref1 = namespace.actions;
    for (name in ref1) {
      action = ref1[name];
      if (action.description == null) {
        this.shutdown("No description for action: " + name);
      }
      if (action.supportsUpdates == null) {
        this.shutdown("No update mode for action: " + name);
      }
      if (action.params == null) {
        action.params = {};
      }
      if (action.possibleErrors == null) {
        action.possibleErrors = [];
      }
      if (action.middleware == null) {
        action.middleware = [];
      }
      action.middleware = namespace.globalMiddleware.concat(action.middleware);
    }
    this.namespaces[namespace.namespace] = namespace;
    return l.success("Namespace registered: " + namespace.namespace);
  };

  FloodProcessor.prototype.validateIntegrity = function() {
    var action, actionName, middleware, name, namespace, ref, results;
    ref = this.namespaces;
    results = [];
    for (name in ref) {
      namespace = ref[name];
      results.push((function() {
        var ref1, results1;
        ref1 = namespace.actions;
        results1 = [];
        for (actionName in ref1) {
          action = ref1[actionName];
          results1.push((function() {
            var j, len, ref2, results2;
            ref2 = action.middleware;
            results2 = [];
            for (j = 0, len = ref2.length; j < len; j++) {
              middleware = ref2[j];
              if (this.resolveMiddleware(name, middleware) == null) {
                results2.push(this.shutdown("Invalid middleware: '" + middleware + "'  used in " + name + "." + actionName));
              } else {
                results2.push(void 0);
              }
            }
            return results2;
          }).call(this));
        }
        return results1;
      }).call(this));
    }
    return results;
  };

  FloodProcessor.prototype.start = function() {
    this.eventSocket = new WebSocket("" + (this.config.eventServer.useWss ? "wss://" : "ws://") + this.config.eventServer.ip + ":" + this.config.eventServer.port);
    this.eventSocket.on("error", (function(_this) {
      return function(err) {
        return _this.shutdown("Unable to connect to event server");
      };
    })(this));
    return this.eventSocket.on("open", (function(_this) {
      return function() {
        l.success("Connection to event server instantiated");
        _this.sendEvent({
          messageType: "init",
          params: {
            type: "processor"
          }
        });
        return _this.connectToDb(function() {
          _this.eventSocket.on("message", function(message) {
            var data, e, error1;
            try {
              data = JSON.parse(message.toString());
            } catch (error1) {
              e = error1;
              l.error("Invalid message from Event server: " + (message.toString()));
            }
            if (data != null) {
              return _this.processEventMessage(data);
            }
          });
          _this.eventSocket.on("close", function() {
            return this.shutdown("Event Server shutdown");
          });
          if (_this.config.interfaces.http.enabled) {
            _this.webInterface = new WebInterface(_this.config.interfaces.http.port, _this);
          }
          if (_this.config.interfaces.ws.enabled) {
            _this.webSocketInterface = new WebSocketInterface({
              processor: _this,
              server: _this.config.interfaces.ws.useHtttp ? _this.webInterface.getServer() : null,
              allowedOrigins: _this.config.interfaces.ws.allowedOrigins
            });
          }
          return _this.webInterface.listen();
        });
      };
    })(this));
  };

  FloodProcessor.prototype.resolveMiddleware = function(currentNamespace, name) {
    var split;
    if (name.indexOf(".") === -1) {
      return this.namespaces[currentNamespace].middleware[name];
    } else {
      split = name.split(".");
      return this.namespaces[split[0]].middleware[split[1]];
    }
  };

  FloodProcessor.prototype.processRequest = function(request) {
    var action, currentMiddleware, proceed;
    if (this.namespaces[request.namespace] != null) {
      action = this.namespaces[request.namespace].actions[request.action];
      if (action != null) {
        if (action.supportsUpdates && !request.supportsUpdates) {
          return request.failRaw({
            errorCode: "incompatibleProtocol",
            description: "The action '" + request.action + "' is not compatible with this protocol!"
          });
        } else {
          proceed = (function(_this) {
            return function(request) {
              return validator.validate(request.params, {
                type: "object",
                children: action.params,
                mode: "shorten"
              }, function(err, params) {
                var errorCode, errors, events, meta, ref, result;
                if (err != null) {
                  return request.failRaw({
                    errorCode: "invalidParams",
                    details: err
                  });
                }
                request.params = params;
                errors = {};
                ref = action.possibleErrors;
                for (errorCode in ref) {
                  meta = ref[errorCode];
                  errors[errorCode] = function(moreInfo) {
                    return request.failRaw(_.extend(meta, moreInfo, {
                      errorCode: errorCode
                    }));
                  };
                }
                result = function(data, final) {
                  if (final == null) {
                    final = false;
                  }
                  validator.validate(data, {
                    type: "object",
                    children: action.result,
                    mode: "shorten"
                  }, (function(_this) {
                    return function(err, newData) {
                      if (err != null) {
                        l.error("Invalid result for request: " + request.namespace + "." + request.action + "\nData:", data, "\nError: \n", err);
                        return request.failRaw({
                          errorCode: "internalError"
                        });
                      } else {
                        return request.send(newData);
                      }
                    };
                  })(this));
                  if (final || !action.supportsUpdates) {
                    return request.emit("done");
                  }
                };
                events = new RequestEventEmitter(_this, request.namespace);
                _this.listeners.push(events);
                request.once("done", function() {
                  events.clearUp();
                  return _this.listeners.splice(_this.listeners.indexOf(events), 1);
                });
                return action.process({
                  session: request.session,
                  params: request.params,
                  fail: errors,
                  ev: events,
                  res: result,
                  db: _this.db
                });
              });
            };
          })(this);
          if (action.middleware.length !== 0) {
            currentMiddleware = 0;
            return this.nextMiddleware(request, currentMiddleware, action);
          } else {
            return proceed(request);
          }
        }
      } else {
        return request.failRaw({
          errorCode: "invalidAction",
          description: "The action '" + request.action + "' does not exist!"
        });
      }
    } else {
      return request.failRaw({
        errorCode: "invalidNamespace",
        description: "The namespace '" + request.namespace + "' does not exist!"
      });
    }
  };

  FloodProcessor.prototype.nextMiddleware = function(request, currentMiddleware, action) {
    var middleware;
    middleware = this.resolveMiddleware(request.namespace, action.middleware[currentMiddleware]);
    return validator.validate(request.params, {
      type: "object",
      children: middleware.params,
      mode: "shorten"
    }, (function(_this) {
      return function(err, params) {
        var errorCode, errors, meta, ref;
        if (err != null) {
          return request.failRaw({
            errorCode: "invalidParams",
            details: err
          });
        }
        params = request.params;
        errors = {};
        ref = middleware.possibleErrors;
        for (errorCode in ref) {
          meta = ref[errorCode];
          errors[errorCode] = function(moreInfo) {
            request.failRaw(_.extend(meta, moreInfo, {
              errorCode: errorCode
            }));
            return request.err = true;
          };
        }
        request.fail = errors;
        return middleware.process(request, function(newRequest) {
          if (newRequest.err == null) {
            if (newRequest == null) {
              newRequest = request;
            }
            if (currentMiddleware !== action.middleware.length - 1) {
              currentMiddleware++;
              return _this.nextMiddleware(newRequest, currentMiddleware, action);
            } else {
              return proceed(newRequest);
            }
          }
        });
      };
    })(this));
  };

  FloodProcessor.prototype.generateDocumentation = function() {
    var action, actionName, error, errorCode, file, j, len, middleware, middlewareName, name, namespace, ref, ref1, ref2, ref3, ref4, ref5, results;
    if (!fs.existsSync("./docs")) {
      fs.mkdirSync("./docs");
    }
    ref = this.namespaces;
    results = [];
    for (name in ref) {
      namespace = ref[name];
      file = "# Namespace: " + name + "\n\n --- \n";
      if (namespace.description != null) {
        file += "##Description: \n" + namespace.description + "\n\n";
      }
      if ((namespace.middleware != null) && Object.keys(namespace.middleware).length !== 0) {
        file += "##Middleware\n\n";
        ref1 = namespace.middleware;
        for (middlewareName in ref1) {
          middleware = ref1[middlewareName];
          file += "###" + middlewareName + " \n";
          file += middleware.description + "\n\n --- \n\n";
          if (middleware.params != null) {
            file += "####Parameters\n json```" + JSON.stringify(middleware.params) + "```\n";
          }
          file += "####Possible errors \n";
          ref2 = middleware.possibleErrors;
          for (errorCode in ref2) {
            error = ref2[errorCode];
            file += "**" + errorCode + "**\n";
            if (error.description != null) {
              file += "\t*" + error.description.trim() + "*";
            }
          }
        }
      }
      if (namespace.actions && Object.keys(namespace.actions).length !== 0) {
        file += "##Actions\n\n";
        ref3 = namespace.actions;
        for (actionName in ref3) {
          action = ref3[actionName];
          file += "* ###" + actionName + " \n\n";
          file += "\t*" + action.description + "*\n";
          file += "\t* **Supports updates:** " + (action.supportsUpdates ? "Yes" : "No") + " \n";
          if ((action.middleware != null) && action.middleware.length !== 0) {
            file += "\t* **Middlware used:** \n";
            ref4 = action.middleware;
            for (j = 0, len = ref4.length; j < len; j++) {
              middleware = ref4[j];
              file += "\t\t* " + middleware + "\n";
            }
          }
          file += "\t* **Parameters:**\n\n \t\t```json\n" + JSON.stringify(action.params, null, 4).split("\n").map(function(i) {
            return "\t\t" + i;
          }).join("\n") + "\n```\n";
          file += "\t* **Possible errors**:\n";
          if ((action.possibleErrors != null) && Object.keys(action.possibleErrors).length !== 0) {
            ref5 = action.possibleErrors;
            for (errorCode in ref5) {
              error = ref5[errorCode];
              file += "**" + errorCode + "**\n";
              if (error.description != null) {
                file += "\t*" + error.description.trim() + "*";
              }
            }
          } else {
            file += "None\n";
          }
        }
      }
      results.push(fs.writeFile("./docs/" + name + ".md", file));
    }
    return results;
  };

  return FloodProcessor;

})(EventEmitter);

module.exports = FloodProcessor;
