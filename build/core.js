var EventEmitter, FloodEventListener, FloodProcessor, RequestEventEmitter, WebInterface, WebSocket, WebSocketInterface, _, fs, l, r, validator,
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

FloodEventListener = require("flood-events").Client;

FloodProcessor = (function(superClass) {
  extend(FloodProcessor, superClass);

  FloodProcessor.CrudNamespace = require("./crudNamespace");

  FloodProcessor.prototype.isFloodProcessor = function() {
    return true;
  };

  function FloodProcessor(config) {
    var ref, ref1, ref2;
    this.namespaces = {};
    this.listeners = [];
    this.config = {
      db: (ref = config.db) != null ? ref : {
        db: "floodway"
      },
      eventServer: (ref1 = config.eventServer) != null ? ref1 : "ws://localhost:3000/",
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
            var i, len, requiredTables, results, table;
            if (err != null) {
              _this.shutdown("Database not compatible: " + err);
            }
            requiredTables = ["sessions"];
            results = [];
            for (i = 0, len = requiredTables.length; i < len; i++) {
              table = requiredTables[i];
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

  FloodProcessor.prototype.shutdown = function(reason) {
    throw new Error(reason);
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
            var i, len, ref2, results2;
            ref2 = action.middleware;
            results2 = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              middleware = ref2[i];
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
    this.events = new FloodEventListener(this.config.eventServer);
    return this.events.on("ready", (function(_this) {
      return function() {
        return _this.connectToDb(function() {
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
    })(this), true);
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

  FloodProcessor.prototype.resolveAction = function(currentNamespace, name) {
    var split;
    if (name.indexOf(".") === -1) {
      return this.namespaces[currentNamespace].actions[name];
    } else {
      split = name.split(".");
      return this.namespaces[split[0]].actions[split[1]];
    }
  };

  FloodProcessor.prototype.processRequest = function(request) {
    var cleanUp, onCleanUp, toCleanUp;
    if (this.namespaces[request.namespace] == null) {
      request.failRaw({
        errorCode: "invalidNamespace",
        description: "The namespace '" + request.namespace + " is not registered!'"
      });
      return;
    }
    if (this.namespaces[request.namespace].actions == null) {
      request.failRaw({
        errorCode: "invalidAction",
        description: "The action '" + request.action + " is not registered in namespace '" + request.namespace + "'!"
      });
      return;
    }
    toCleanUp = [];
    onCleanUp = function(fn) {
      return toCleanUp.push(fn);
    };
    cleanUp = function() {
      var fn, i, len;
      for (i = 0, len = toCleanUp.length; i < len; i++) {
        fn = toCleanUp[i];
        fn();
      }
      return request.emit("done");
    };
    return this.runAction({
      params: request.params,
      namespace: request.namespace,
      name: request.action,
      session: request.session,
      onCleanUp: onCleanUp
    }, {
      callback: function(err, data) {
        if (err != null) {
          request.failRaw(err);
          return cleanUp();
        } else {
          request.send(data);
          if (!request.supportsUpdates) {
            return cleanUp();
          }
        }
      }
    });
  };

  FloodProcessor.prototype.runAction = function(arg) {
    var action, callback, name, namespace, onCleanUp, params, session;
    params = arg.params, namespace = arg.namespace, name = arg.name, session = arg.session, callback = arg.callback, onCleanUp = arg.onCleanUp;
    action = this.resolveAction(namespace, name);
    if (action != null) {
      return validator.validate(params, action.params, (function(_this) {
        return function(err, params) {
          if (err != null) {
            return callback({
              errorCode: "invalidParams",
              details: err
            });
          } else {
            return _this.processMiddleware({
              middlewareList: action.middleware
            }, session, params, namespace, {
              callback: function(err, params) {
                var actionName, errorCode, fail, i, len, listen, meta, ref, ref1, run, toRemove;
                if (err != null) {
                  return callback(err);
                }
                toRemove = [];
                listen = function(name, callback) {
                  toRemove.push({
                    name: name,
                    callback: callback
                  });
                  return _this.events.on(name, callback);
                };
                onCleanUp(function() {
                  var i, item, len, results;
                  results = [];
                  for (i = 0, len = toRemove.length; i < len; i++) {
                    item = toRemove[i];
                    results.push(_this.events.off(item.name, item.callback));
                  }
                  return results;
                });
                fail = {};
                ref = action.possibleErrors;
                for (errorCode in ref) {
                  meta = ref[errorCode];
                  fail[errorCode] = function(moreInfo) {
                    return callback(_.extend(meta, moreInfo, {
                      errorCode: errorCode
                    }));
                  };
                }
                run = {};
                ref1 = action.calls;
                for (i = 0, len = ref1.length; i < len; i++) {
                  actionName = ref1[i];
                  run[actionName] = function(callback) {
                    return _this.runAction(params, namespace, {
                      name: actionName
                    }, session, {
                      callback: callback
                    }, onCleanUp);
                  };
                }
                return action.process(session, params, listen, run, onCleanUp, {
                  emit: _this.events.emit,
                  res: function(data) {
                    return validator.validate(data, action.result, function(err, result) {
                      if (err != null) {
                        return callback({
                          errorCode: "invalidResult",
                          details: err
                        });
                      } else {
                        return callback(null, result);
                      }
                    });
                  }
                });
              }
            });
          }
        };
      })(this));
    } else {
      return callback({
        errorCode: "unknownAction"
      });
    }
  };

  FloodProcessor.prototype.processMiddleware = function(arg) {
    var callback, currentMiddleware, middlwareList, namespace, next, params, session;
    middlwareList = arg.middlwareList, session = arg.session, params = arg.params, callback = arg.callback, namespace = arg.namespace;
    if (middlwareList.length === 0) {
      callback(null, params);
    }
    currentMiddleware = 0;
    return next = function(params) {
      return runMiddleware({
        session: session,
        params: params,
        namespace: namespace,
        name: middlwareList[currentMiddleware],
        callback: function(err, newParams) {
          if (err != null) {
            return callback(err);
          }
          if (currentMiddleware === middlwareList.length - 1) {
            return callback(null, newParams);
          } else {
            return next(newParams);
          }
        }
      });
    };
  };

  FloodProcessor.prototype.runMiddleware = function(arg) {
    var callback, errorCode, fail, meta, middleware, name, namespace, params, ref, session;
    session = arg.session, params = arg.params, callback = arg.callback, namespace = arg.namespace, name = arg.name;
    middleware = this.resolveMiddleware(namespace, name);
    fail = {};
    ref = middleware.possibleErrors;
    for (errorCode in ref) {
      meta = ref[errorCode];
      fail[errorCode] = function(moreInfo) {
        return callback(_.extend(meta, moreInfo, {
          errorCode: errorCode
        }));
      };
    }
    return validator.validate(params, middleware.params, (function(_this) {
      return function(err, params) {
        if (err != null) {
          return callback({
            errorCode: "invalidParams",
            description: "The parameters passed to '" + name + "' were invalid. (NS: '" + namespace + "')",
            details: err
          });
        } else {
          return middleware.process({
            fail: fail,
            on: _this.events.once,
            params: params,
            session: session,
            emit: _this.events.emit,
            callback: function(params) {
              return callback(null, params);
            }
          });
        }
      };
    })(this));
  };

  return FloodProcessor;

})(EventEmitter);

module.exports = FloodProcessor;
