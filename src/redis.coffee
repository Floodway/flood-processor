redis = require("redis")
l = require("./log")
module.exports =

  namespace: "redis"

  provideGlobals:


    connection:
      description: "Provides a redis connection"
      process: (params,callback) ->

        client = redis.createClient(params.config.redis)

        client.on("error", (err) ->
          l.error("Redis error: ",err)
        )

        client.on("ready", ->
          l.log("Redis connection established!")
          callback(client)
        )

