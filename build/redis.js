var l, redis;

redis = require("redis");

l = require("./log");

module.exports = {
  namespace: "redis",
  provideGlobals: {
    connection: {
      description: "Provides a redis connection",
      process: function(params, callback) {
        var client;
        client = redis.createClient(params.config.redis);
        client.on("error", function(err) {
          return l.error("Redis error: ", err);
        });
        return client.on("ready", function() {
          l.log("Redis connection established!");
          return callback(client);
        });
      }
    }
  }
};
