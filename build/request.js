var EventEmitter, Request,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

Request = (function(superClass) {
  extend(Request, superClass);

  function Request(params) {
    this.namespace = params.namespace, this.params = params.params, this.action = params.action, this.sendData = params.sendData, this.supportsUpdates = params.supportsUpdates, this.session = params.session;
    this.failed = false;
    if (this.supportsUpdates) {
      this.once("done", (function(_this) {
        return function() {
          console.log("Request done..");
          return _this.sendData({
            messageType: "done"
          });
        };
      })(this));
    }
  }

  Request.prototype.send = function(data) {
    if (!this.failed) {
      this.sendData({
        messageType: "response",
        data: data
      });
    }
    if (!this.supportsUpdates) {
      return this.emit("done");
    }
  };

  Request.prototype.failRaw = function(error) {
    if (!this.failed) {
      this.sendData({
        messageType: "error",
        error: error
      });
      this.emit("done");
      return this.failed = true;
    }
  };

  return Request;

})(EventEmitter);

module.exports = Request;
