"use strict";
var AsyncGroup = (function () {
    function AsyncGroup(callback, breakOnError) {
        if (breakOnError === void 0) { breakOnError = true; }
        this.failed = false;
        this.callback = callback;
        this.runnables = [];
        this.breakOnError = breakOnError;
    }
    AsyncGroup.prototype.add = function (runnable) {
        this.runnables.push(runnable);
        return this;
    };
    AsyncGroup.prototype.run = function () {
        var _this = this;
        this.failed = false;
        var done = 0;
        var results = [];
        if (this.runnables.length == 0) {
            return this.callback(null, results);
        }
        var runNext = function () {
            var current = _this.runnables[done];
            current(function (err, res) {
                if (err != null) {
                    if (_this.breakOnError) {
                        _this.callback(err, null);
                        return;
                    }
                    else {
                        results.push(err);
                    }
                }
                else {
                    results.push(res);
                }
                done++;
                if (done == _this.runnables.length) {
                    _this.callback(null, results);
                }
                else {
                    runNext();
                }
            });
        };
        runNext();
    };
    return AsyncGroup;
}());
exports.AsyncGroup = AsyncGroup;
