var EventEmitter, FloodProcessor, WebInterface, WebSocket, fs, l, r, validator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

WebSocket = require("ws");

EventEmitter = require("events").EventEmitter;

r = require("rethinkdb");

validator = require("flood-gate");

l = require("./log");

fs = require("fs");

WebInterface = require("./webInterface");


/*
  Todo:
    - Connect to event server
    - Register namespaces
    - Register actions
    - Construct interfaces
    - Database connection
    - Validate source-code
    - Generate Documentation?
 */

FloodProcessor = (function(superClass) {
  extend(FloodProcessor, superClass);

  function FloodProcessor(config) {
    var ref, ref1, ref2;
    this.namespaces = {};
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
          port: null,
          useHtttp: true
        }
      }
    };
    this.eventSocket = new WebSocket("" + (this.config.eventServer.useWss ? "wss://" : "ws://") + this.config.eventServer.ip + ":" + this.config.eventServer.port);
    this.eventSocket.on("open", (function(_this) {
      return function() {
        l.success("Connection to event server instantiated");
        _this.sendEvent({
          messageType: "init",
          params: {
            type: "processor"
          }
        });
        return _this.connectToDb();
      };
    })(this));
    this.eventSocket.on("message", (function(_this) {
      return function(message) {
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
      };
    })(this));
    this.eventSocket.on("close", function() {
      return this.shutdown("Event Server shutdown");
    });
  }

  FloodProcessor.prototype.connectToDb = function() {
    return r.connect(this.config.db, (function(_this) {
      return function(err, conn) {
        if (err != null) {
          _this.shutdown("Db Connection failed: " + err);
        }
        _this.db = conn;
        _this.checkDb();
        return _this.start();
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

  FloodProcessor.prototype.processEventMessage = function(data) {
    if ((data.messageType != null) && (data.params != null)) {
      switch (data.messageType) {
        case "event":
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
    if (namespace.namespace == null) {
      this.shutdown("No namespace provided");
    }
    if (this.namespaces[namespace.namespace] != null) {
      this.shutdown("Duplicate namespace used");
    }
    if ((namespace.actions == null) && (namespace.middleware == null)) {
      this.shutdown("Empty namespace: Provide at least 1 action or middleware");
    }
    this.namespaces[namespace.namespace] = namespace;
    return l.success("Namespace registered: " + namespace.namespace);
  };

  FloodProcessor.prototype.start = function() {
    this.webInterface = new WebInterface(this.config.interfaces.http.port, this);
    this.webInterface.listen();
    return this.generateDocumentation();
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
    var action, currentMiddleware, nextMiddleware, proceed;
    if (this.namespaces[request.namespace] != null) {
      action = this.namespaces[request.namespace].actions[request.action];
      if (action != null) {
        if (action.supportsUpdates && !request.supportsUpdates) {
          return request.fail({
            errorCode: "incompatibleProtocol",
            description: "The action '" + request.action + "' is not compatible with this protocol!"
          });
        } else {
          proceed = (function(_this) {
            return function(request) {
              l.log("Validating..", request.params, {
                type: "object",
                children: action.params,
                mode: "shorten"
              });
              return validator.validate(request.params, {
                type: "object",
                children: action.params,
                mode: "shorten"
              }, function(err, params) {
                if (err != null) {
                  return request.fail({
                    errorCode: "invalidParams",
                    details: err
                  });
                }
                l.log("Processing request...");
                request.params = params;
                return action.process({
                  req: request,
                  db: _this.db
                });
              });
            };
          })(this);
          if ((action.middleware != null) && action.middleware.length !== 0) {
            currentMiddleware = 0;
            return nextMiddleware = (function(_this) {
              return function(request) {
                var process;
                process = _this.resolveMiddleware(request.namespace, action.middleware[currentMiddleware]);
                return process(request, function(err, request) {
                  if (err != null) {
                    return request.fail(err);
                  } else if (currentMiddleware !== action.middleware.length - 1) {
                    currentMiddleware++;
                    return nextMiddleware(request);
                  } else {
                    return proceed(request);
                  }
                });
              };
            })(this);
          } else {
            return proceed(request);
          }
        }
      } else {
        return request.fail({
          errorCode: "invalidAction",
          description: "The action '" + request.action + "' does not exist!"
        });
      }
    } else {
      return request.fail({
        errorCode: "invalidNamespace",
        description: "The namespace '" + request.namespace + "' does not exist!"
      });
    }
  };

  FloodProcessor.prototype.generateDocumentation = function() {
    var action, error, errorCode, file, i, len, middleware, name, namespace, ref, ref1, ref2, ref3, ref4, ref5, results;
    ref = this.namespaces;
    results = [];
    for (name in ref) {
      namespace = ref[name];
      file = "# Namespace: " + name + "\n\n --- ";
      if (namespace.description) {
        file += namespace.description + "\n\n";
      }
      if ((namespace.middleware != null) && Object.keys(namespace.middleware).length !== 0) {
        file += "##Middleware\n\n";
        ref1 = namespace.middleware;
        for (name in ref1) {
          middleware = ref1[name];
          file += "###" + name + " \n";
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
        for (name in ref3) {
          action = ref3[name];
          file += "##" + name + " \n";
          file += action.description + "\n\n --- \n\n";
          file += "**Supports updates:** " + (action.supportsUpdates ? "Yes" : "No") + " \n";
          if ((action.middleware != null) && action.middleware.length !== 0) {
            file += "####Middlware used \n";
            ref4 = action.middleware;
            for (i = 0, len = ref4.length; i < len; i++) {
              middleware = ref4[i];
              file += "-" + middleware + "\n";
            }
          }
          file += "\n####Parameters\n json```" + JSON.stringify(action.params) + "```\n";
          file += "####Possible errors \n";
          ref5 = action.possibleErrors;
          for (errorCode in ref5) {
            error = ref5[errorCode];
            file += "**" + errorCode + "**\n";
            if (error.description != null) {
              file += "\t*" + error.description.trim() + "*";
            }
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
