var Session, l, r;

r = require("rethinkdb");

l = require("./log");

Session = (function() {
  function Session(ssid, db1) {
    this.ssid = ssid;
    this.db = db1;
  }

  Session.prototype.verify = function(cb) {
    return r.table("sessions").get(this.ssid).run(this.db, function(err, doc) {
      if ((err != null) || (doc == null)) {
        return cb(new Error("InvalidSsid"));
      } else {
        return cb(null);
      }
    });
  };

  Session.prototype.get = function(name, callback) {
    return r.table("sessions").get(this.ssid)(name).run(this.db, callback);
  };

  Session.prototype.set = function(name, value, cb) {
    var u;
    u = {};
    u[name] = value;
    return r.table("sessions").get(this.ssid).update(u).run(this.db, cb);
  };

  Session.createSession = function(db, callback) {
    return r.table("sessions").insert({
      created: Date.now()
    }).run(db, function(err, inserted) {
      if (err != null) {
        l.error("Creating session failed: " + err);
      }
      if (err != null) {
        return callback(err);
      } else {
        return callback(null, new Session(inserted.generated_keys[0], db));
      }
    });
  };

  return Session;

})();

module.exports = Session;
