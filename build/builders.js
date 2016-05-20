var Action, Middleware, Namespace, _, ensure;

ensure = require("is_js");

_ = require("lodash");

Namespace = (function() {
  function Namespace() {
    this.tree = {};
  }

  Namespace.prototype.withName = function(name) {
    this.tree.namespace = name;
    return this;
  };

  Namespace.prototype.withGlobalMiddleware = function(middleware, override) {
    if (override == null) {
      override = false;
    }
    if (override) {
      this.tree.globalMiddleware = middleware;
      return this;
    } else {
      if (this.tree.globalMiddleware == null) {
        this.tree.globalMiddleware = [];
      }
      return this.tree.globalMiddleware = this.tree.globalMiddleware.concat(middleware);
    }
  };

  Namespace.prototype.withGlobalProvider = function(name, description, getGlobal, override) {
    if (override == null) {
      override = false;
    }
    if (this.tree.provideGlobals == null) {
      this.tree.provideGlobals = {};
    }
    if (!override && (this.tree.provideGlobals[name] != null)) {
      throw new Error("Global variable: " + name + " is already configured");
    }
    this.tree.provideGlobals[name] = {
      description: description,
      process: getGlobal
    };
    return this;
  };

  Namespace.prototype.withGlobal = function(globVar, as) {
    if (this.tree.globals == null) {
      this.tree.globals = {};
    }
    this.tree.globals[globVar] = as;
    return this;
  };

  Namespace.prototype.withOnStart = function(onStart, override) {
    if (override == null) {
      override = false;
    }
    if ((this.tree.onStart != null) && !override) {
      throw new Error("Trying to override startup function for " + this.tree.namespace + ". Use override=true to force");
    }
    this.tree.onStart = onStart;
    return this;
  };

  Namespace.prototype.withAction = function(action) {
    if (this.tree.actions == null) {
      this.tree.actions = {};
    }
    if (this.tree.actions[action.getName()] != null) {
      throw new Error("Trying to implement action '" + (action.getName()) + "' twice!");
    } else {
      this.tree.actions[action.getName()] = action;
      return this;
    }
  };

  Namespace.prototype.withModifiedAction = function(name, modify) {
    if (this.tree.actions[name] == null) {
      throw new Error("Can not modify action '" + name + "'. It does not exist!");
    }
    this.tree.actions[name] = modify(this.tree.actions[name]);
    return this;
  };

  Namespace.prototype.withMiddleware = function(middleware, override) {
    if (override == null) {
      override = false;
    }
    if (this.tree.middleware == null) {
      this.tree.middleware = {};
    }
    if ((this.tree.middleware[middleware.getName()] != null) && !override) {
      throw new Error("Middleware '" + (middleware.getName()) + "' is already registered in this namespace. Re-name or force override");
    }
    this.tree.middleware[middleware.getName()] = middleware;
    return this;
  };

  Namespace.prototype.withSchema = function(name, schema, override) {
    if (override == null) {
      override = false;
    }
    if (this.tree.schemas == null) {
      this.tree.schemas = {};
    }
    if ((this.tree.schemas[name] != null) && !override) {
      throw new Error("There's already a schema with name '" + name + "' defined in " + this.tree.namespace + ". Re-name or force override.");
    }
    this.tree.schemas[name] = schema;
    return this;
  };

  Namespace.prototype.build = function() {
    var action, middleware, name, ref, ref1;
    if (this.tree.namespace == null) {
      throw new Error("No namespace defined");
    }
    if (this.tree.middleware != null) {
      ref = this.tree.middleware;
      for (name in ref) {
        middleware = ref[name];
        this.tree.middleware[name] = middleware.build();
      }
    }
    if (this.tree.actions != null) {
      ref1 = this.tree.actions;
      for (name in ref1) {
        action = ref1[name];
        this.tree.actions[name] = action.build();
      }
    }
    return this.tree;
  };

  return Namespace;

})();

Middleware = (function() {
  function Middleware(name) {
    this.name = name;
    this.tree = {};
  }

  Middleware.prototype.getName = function() {
    return this.name;
  };

  Middleware.prototype.withParams = function(params) {
    this.tree.params = params;
    return this;
  };

  Middleware.prototype.withValidationMode = function(mode) {
    this.tree.validationMode = mode;
    return this;
  };

  Middleware.prototype.withGlobal = function(globVar, as) {
    if (this.tree.globals == null) {
      this.tree.globals = {};
    }
    this.tree.globals[globVar] = as;
    return this;
  };

  Middleware.prototype.withProcess = function(process) {
    this.tree.process = process;
    return this;
  };

  Middleware.prototype.build = function() {
    return this.tree;
  };

  return Middleware;

})();

Action = (function() {
  function Action() {
    this.tree = {};
  }

  Action.prototype.withName = function(name) {
    this.name = name;
    return this;
  };

  Action.prototype.isPrivate = function(boolean) {
    this.tree.isPrivate = boolean === true;
    return this;
  };

  Action.prototype.withUpdateMode = function(updateMode) {
    this.tree.supportsUpdates = updateMode === true;
    return this;
  };

  Action.prototype.withDescription = function(description) {
    this.tree.description = description;
    return this;
  };

  Action.prototype.withParams = function(params) {
    this.tree.params = params;
    return this;
  };

  Action.prototype.withResult = function(result) {
    this.tree.result = result;
    return this;
  };

  Action.prototype.withProcess = function(process) {
    this.tree.process = process;
    return this;
  };

  Action.prototype.withError = function(errorCode, description, meta) {
    if (this.tree.possibleErrors == null) {
      this.tree.possibleErrors = {};
    }
    this.tree.possibleErrors[errorCode] = _.extend({
      description: description
    }, meta);
    return this;
  };

  Action.prototype.withMiddleware = function(middleware, override) {
    if (override == null) {
      override = false;
    }
    if (this.tree.middleware == null) {
      this.tree.middleware = [];
    }
    if (ensure.array(middleware)) {
      if (override) {
        this.tree.middleware = middleware;
      } else {
        this.tree.middleware = this.tree.middleware.concat(middleware);
      }
    } else if (ensure.string(middleware)) {
      this.tree.middleware.push(middleware);
    } else {
      trow(new Error("Middleware must either be a string or an array"));
    }
    return this;
  };

  Action.prototype.getName = function() {
    return this.name;
  };

  Action.prototype.build = function() {
    return this.tree;
  };

  return Action;

})();

module.exports = {
  Action: Action,
  Middleware: Middleware,
  Namespace: Namespace
};
