var Action, AsyncWait, EventEmitter, FloodEventListener, FloodProcessor, Middleware, Namespace, WebInterface, WebSocketInterface, _, ensure, fs, l, ref, validator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ensure = require("is_js");

EventEmitter = require("events").EventEmitter;

validator = require("flood-gate");

WebInterface = require("./webInterface");

WebSocketInterface = require("./webSocketInterface");

FloodEventListener = require("flood-events").Client;

l = require("./log");

_ = require("lodash");

fs = require("fs");

AsyncWait = require("./asyncWait");

ref = require("./builders"), Action = ref.Action, Middleware = ref.Middleware, Namespace = ref.Namespace;

FloodProcessor = (function(superClass) {
  extend(FloodProcessor, superClass);

  FloodProcessor.Action = Action;

  FloodProcessor.Middleware = Middleware;

  FloodProcessor.Namespace = Namespace;

  FloodProcessor.prototype.isFloodProcessor = function() {
    return true;
  };

  function FloodProcessor(config) {
    var ref1, ref2;
    l.log("Floodway instance with version " + (require("../package.json")["version"]) + " created");
    this.namespaces = {};
    this.globals = {};
    this.listeners = [];
    this.config = {
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
    if (this.config.redis != null) {
      this.namespace(require("./redis"));
    }
    this.namespace(require("./mainNamespace"));
    this.validateIntegrity();
  }

  FloodProcessor.prototype.shutdown = function(reason) {
    throw new Error(reason);
  };

  FloodProcessor.prototype.namespace = function(namespace) {
    var action, middleware, name, ref1, ref2;
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
    ref1 = namespace.middleware;
    for (name in ref1) {
      middleware = ref1[name];
      if (!middleware.description) {
        this.shutdown("No description for middleware: " + name);
      }
      if (middleware.params == null) {
        middleware.params = {};
      }
    }
    ref2 = namespace.actions;
    for (name in ref2) {
      action = ref2[name];
      if (action.description == null) {
        this.shutdown("No description for action: " + name);
      }
      if (action.supportsUpdates == null) {
        this.shutdown("No update mode for action: " + name);
      }
      if (action.params == null) {
        action.params = {};
      } else {
        if (ensure.string(action.params)) {
          if (namespace.schemas[action.params] == null) {
            this.shutdown("Schema not defined for action:" + name + " schema: " + action.params);
          }
        }
      }
      if (action.possibleErrors == null) {
        action.possibleErrors = {};
      }
      if (action.middleware == null) {
        action.middleware = [];
      }
      if (action.calls == null) {
        action.calls = [];
      }
      action.middleware = namespace.globalMiddleware.concat(action.middleware);
    }
    this.namespaces[namespace.namespace] = namespace;
    return l.success("Namespace registered: " + namespace.namespace);
  };

  FloodProcessor.prototype.validateIntegrity = function() {
    var action, actionName, middleware, name, namespace, ref1, results;
    ref1 = this.namespaces;
    results = [];
    for (name in ref1) {
      namespace = ref1[name];
      results.push((function() {
        var ref2, results1;
        ref2 = namespace.actions;
        results1 = [];
        for (actionName in ref2) {
          action = ref2[actionName];
          results1.push((function() {
            var i, len, ref3, results2;
            ref3 = action.middleware;
            results2 = [];
            for (i = 0, len = ref3.length; i < len; i++) {
              middleware = ref3[i];
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

  FloodProcessor.prototype.convertSchemas = function() {
    var action, actionName, convert, middleware, middlewareName, name, namespace, ref1, ref2, ref3, results, schema, schemaName;
    l.success("Converting schemas...");
    convert = function(input, namespace) {
      var key, value;
      if (ensure.string(input)) {
        if (namespace.schemas[input] != null) {
          return namespace.schemas[input];
        } else {
          return this.shutdown("Invalid schema used: " + input);
        }
      } else {
        if (ensure.object(input)) {
          if ((input.type != null) && ensure.string(input.type)) {
            if (input.children != null) {
              input.children = convert(input.children, namespace);
            }
            return input;
          } else {
            for (key in input) {
              value = input[key];
              input[key] = convert(value, namespace);
            }
            return input;
          }
        }
      }
    };
    ref1 = this.namespaces;
    results = [];
    for (name in ref1) {
      namespace = ref1[name];
      if (namespace.schemas != null) {
        ref2 = namespace.schemas;
        for (schemaName in ref2) {
          schema = ref2[schemaName];
          namespace.schemas[schemaName] = convert(schema, namespace);
        }
      }
      if (namespace.middleware != null) {
        ref3 = namespace.middleware;
        for (middlewareName in ref3) {
          middleware = ref3[middlewareName];
          namespace.middleware[middlewareName].params = convert(middleware.params, namespace);
        }
      }
      if (namespace.middleware != null) {
        results.push((function() {
          var ref4, results1;
          ref4 = namespace.actions;
          results1 = [];
          for (actionName in ref4) {
            action = ref4[actionName];
            namespace.actions[actionName].params = convert(action.params, namespace);
            results1.push(namespace.actions[actionName].result = convert(action.result, namespace));
          }
          return results1;
        })());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  FloodProcessor.prototype.start = function() {
    this.convertSchemas();
    this.events = new FloodEventListener(this.config.eventServer);
    if (this.config.interfaces.http.enabled) {
      this.webInterface = new WebInterface(this.config.interfaces.http.port, this);
    }
    if (this.config.interfaces.ws.enabled) {
      this.webSocketInterface = new WebSocketInterface({
        processor: this,
        server: this.config.interfaces.ws.useHtttp ? this.webInterface.getServer() : null,
        allowedOrigins: this.config.interfaces.ws.allowedOrigins
      });
    }
    this.webInterface.listen();
    return this.provideGlobals((function(_this) {
      return function(err) {
        if (err != null) {
          _this.shutdown(err);
        }
        return _this.runInitCode();
      };
    })(this));
  };

  FloodProcessor.prototype.resolveGlobals = function(list, currentNamespace) {
    var globalVar, item, ns, resName, result;
    result = {};
    for (item in list) {
      resName = list[item];
      if (item.indexOf(".") === -1) {
        if ((this.globals[currentNamespace] != null) && (this.globals[currentNamespace][item] != null)) {
          result[resName] = this.globals[currentNamespace][item];
        } else {
          this.shutdown("Unable to resolve global " + currentNamespace + "." + item);
        }
      } else {
        ns = item.split(".")[0];
        globalVar = item.split(".")[1];
        if ((this.globals[ns] != null) && (this.globals[ns][globalVar] != null)) {
          result[resName] = this.globals[ns][globalVar];
        } else {
          this.shutdown("Unable to resolve global " + item);
        }
      }
    }
    return result;
  };

  FloodProcessor.prototype.populateGlobals = function() {
    var namespace, namespaceName, ref1, results;
    ref1 = this.namespaces;
    results = [];
    for (namespaceName in ref1) {
      namespace = ref1[namespaceName];
      if (namespace.globals != null) {
        results.push(namespace.globals = this.resolveGlobals(namespace.globals, namespaceName));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  FloodProcessor.prototype.provideGlobals = function(callback) {
    var asyncWait, fn1, namespace, namespaceName, ref1;
    asyncWait = new AsyncWait();
    ref1 = this.namespaces;
    fn1 = (function(_this) {
      return function(namespaceName, namespace) {
        var ref2, register, results, varName;
        if (namespace.provideGlobals != null) {
          _this.globals[namespaceName] = {};
          ref2 = namespace.provideGlobals;
          results = [];
          for (varName in ref2) {
            register = ref2[varName];
            results.push((function(varName, register) {
              return asyncWait.addStep(function(done) {
                return register.process({
                  config: _this.config
                }, function(globalVar) {
                  if (_this.globals[namespaceName] == null) {
                    _this.globals[namespaceName] = {};
                  }
                  _this.globals[namespaceName][varName] = globalVar;
                  return done();
                });
              });
            })(varName, register));
          }
          return results;
        }
      };
    })(this);
    for (namespaceName in ref1) {
      namespace = ref1[namespaceName];
      fn1(namespaceName, namespace);
    }
    return asyncWait.run((function(_this) {
      return function() {
        _this.populateGlobals();
        return callback();
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

  FloodProcessor.prototype.resolveAction = function(currentNamespace, name) {
    var action, split;
    if (name.indexOf(".") === -1) {
      action = this.namespaces[currentNamespace].actions[name];
    } else {
      split = name.split(".");
      action = this.namespaces[split[0]].actions[split[1]];
    }
    return action;
  };

  FloodProcessor.prototype.runInitCode = function() {
    var name, namespace, ref1, results;
    ref1 = this.namespaces;
    results = [];
    for (name in ref1) {
      namespace = ref1[name];
      if (namespace.onStart != null) {
        results.push(namespace.onStart({
          events: this.events,
          g: namespace.globals,
          processor: this
        }));
      } else {
        results.push(void 0);
      }
    }
    return results;
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
    if ((this.namespaces[request.namespace].actions == null) || (this.namespaces[request.namespace].actions[request.action] == null) || this.namespaces[request.namespace].actions[request.action].isPrivate) {
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
      var fn, i, len, results;
      results = [];
      for (i = 0, len = toCleanUp.length; i < len; i++) {
        fn = toCleanUp[i];
        results.push(fn());
      }
      return results;
    };
    request.once("done", function() {
      return cleanUp();
    });
    return this.runAction({
      params: request.params,
      namespace: request.namespace,
      name: request.action,
      session: request.session,
      onCleanUp: onCleanUp,
      callback: function(err, data) {
        if (err != null) {
          request.failRaw(err);
          return request.emit("done");
        } else {
          request.send(data);
          if (!request.supportsUpdates) {
            return request.emit("done");
          }
        }
      }
    });
  };

  FloodProcessor.prototype.runAction = function(arg) {
    var action, callback, name, namespace, onCleanUp, params, ref1, session;
    params = arg.params, namespace = arg.namespace, name = arg.name, session = arg.session, callback = arg.callback, onCleanUp = arg.onCleanUp;
    action = this.resolveAction(namespace, name);
    if (action != null) {
      return validator.validate(params, {
        type: "object",
        mode: (ref1 = action.validationMode) != null ? ref1 : "shorten",
        children: action.params
      }, (function(_this) {
        return function(err, params) {
          if (err != null) {
            return callback({
              errorCode: "invalidParams",
              details: err
            });
          } else {
            return _this.processMiddleware({
              middlewareList: action.middleware,
              session: session,
              params: params,
              namespace: namespace,
              callback: function(err, params) {
                var actionName, errorCode, fail, i, len, listen, meta, ref2, ref3, run, toRemove;
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
                ref2 = action.possibleErrors;
                for (errorCode in ref2) {
                  meta = ref2[errorCode];
                  fail[errorCode] = function(moreInfo) {
                    return callback(_.extend(meta, moreInfo, {
                      errorCode: errorCode
                    }));
                  };
                }
                run = {};
                ref3 = action.calls;
                for (i = 0, len = ref3.length; i < len; i++) {
                  actionName = ref3[i];
                  run[actionName] = function(callback) {
                    return _this.runAction(params, namespace, {
                      name: actionName
                    }, session, {
                      callback: callback
                    }, onCleanUp);
                  };
                }
                return action.process({
                  session: session,
                  params: params,
                  listen: listen,
                  g: _this.namespaces[namespace].globals,
                  fail: fail,
                  db: _this.db,
                  run: run,
                  onCleanUp: onCleanUp,
                  emit: _this.events.emit,
                  res: function(data) {
                    return validator.validate(data, {
                      type: "object",
                      children: action.result,
                      mode: "shorten"
                    }, function(err, result) {
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
    var callback, currentMiddleware, middlewareList, namespace, next, params, session;
    middlewareList = arg.middlewareList, session = arg.session, params = arg.params, callback = arg.callback, namespace = arg.namespace;
    if (middlewareList.length === 0) {
      callback(null, params);
    }
    currentMiddleware = 0;
    return next = function(params) {
      return runMiddleware({
        session: session,
        params: params,
        namespace: namespace,
        name: middlewareList[currentMiddleware],
        callback: function(err, newParams) {
          if (err != null) {
            return callback(err);
          }
          if (currentMiddleware === middlewareList.length - 1) {
            return callback(null, newParams);
          } else {
            return next(newParams);
          }
        }
      });
    };
  };

  FloodProcessor.prototype.runMiddleware = function(arg) {
    var callback, errorCode, fail, meta, middleware, name, namespace, params, ref1, ref2, session;
    session = arg.session, params = arg.params, callback = arg.callback, namespace = arg.namespace, name = arg.name;
    middleware = this.resolveMiddleware(namespace, name);
    fail = {};
    ref1 = middleware.possibleErrors;
    for (errorCode in ref1) {
      meta = ref1[errorCode];
      fail[errorCode] = function(moreInfo) {
        return callback(_.extend(meta, moreInfo, {
          errorCode: errorCode
        }));
      };
    }
    return validator.validate(params, {
      type: "object",
      mode: (ref2 = middleware.validationMode) != null ? ref2 : "ensure",
      children: middleware.params
    }, (function(_this) {
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
            g: _this.namespaces[namespace].globals,
            session: session,
            db: _this.db,
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
