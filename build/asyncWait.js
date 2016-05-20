var AsyncWait;

AsyncWait = (function() {
  function AsyncWait() {
    this.steps = [];
    this.done = 0;
  }

  AsyncWait.prototype.addStep = function(fn) {
    return this.steps.push(fn);
  };

  AsyncWait.prototype.run = function(callback) {
    var i, len, ref, results, step;
    if (this.steps.length === 0) {
      callback();
    }
    ref = this.steps;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      step = ref[i];
      results.push(step((function(_this) {
        return function() {
          _this.done++;
          return _this.checkDone(callback);
        };
      })(this)));
    }
    return results;
  };

  AsyncWait.prototype.checkDone = function(callback) {
    if (this.done === this.steps.length) {
      return callback();
    }
  };

  return AsyncWait;

})();

module.exports = AsyncWait;
