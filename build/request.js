var EventEmitter, Request,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

EventEmitter = require("events").EventEmitter;

Request = (function(superClass) {
  extend(Request, superClass);


  /*
    REQUEST CLASS
  
    Properties:
  
      namespace: String
      action: String
      params: mixed
  
      supportsUpdates: boolean
  
  
    Methods:
  
      sendData: (mixed)
  
  
    Events:
      cancel
   */

  function Request(params) {
    this.namespace = params.namespace, this.params = params.params, this.action = params.action, this.sendData = params.sendData, this.suppportsUpdates = params.suppportsUpdates, this.session = params.session;
  }

  Request.prototype.send = function(data) {
    this.sendData(data);
    if (!this.suppportsUpdates) {
      return this.emit("done");
    }
  };

  Request.prototype.fail = function(error) {
    this.sendData({
      messageType: "error",
      error: error
    });
    return this.emit("done");
  };

  return Request;

})(EventEmitter);

module.exports = Request;
