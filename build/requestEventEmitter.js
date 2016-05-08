var RequestEventEmitter;

RequestEventEmitter = (function() {
  function RequestEventEmitter(processor, namespace) {
    this.processor = processor;
    this.namespace = namespace;
    this.listeners = {};
  }

  RequestEventEmitter.prototype.on = function(name, cb) {
    if (this.listeners[name] == null) {
      this.listeners[name] = [];
    }
    return this.listeners[name].push(cb);
  };

  RequestEventEmitter.prototype.emit = function(name, params, global) {
    if (global == null) {
      global = false;
    }
    if (!global) {
      return this.processor.emitEvent(this.namespace + ":" + name, params);
    } else {
      return this.processor.emitEvent("global:" + name, params);
    }
  };

  RequestEventEmitter.prototype.once = function(name, cb) {
    var done;
    done = function(params) {
      cb(params);
      return this.off(name, this);
    };
    return this.on(name, done);
  };

  RequestEventEmitter.prototype.clearUp = function() {
    console.log("Cleanup...");
    this.emitEvent("cleanUp");
    return this.listeners = {};
  };

  RequestEventEmitter.prototype.emitEvent = function(name, params) {
    if (this.listeners[name] != null) {
      return this.listeners[name].map(function(listener) {
        return listener(params);
      });
    }
  };

  return RequestEventEmitter;

})();

module.exports = RequestEventEmitter;
