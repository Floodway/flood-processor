r = require("rethinkdb")
l = require("./log")

class Session

  constructor: (@ssid,@db) ->

  verify: (cb) ->
    r.table("sessions").get(@ssid).run(@db,(err,doc) ->

      if err? or not doc? then cb(new Error("InvalidSsid")) else cb(null)

    )


  get: (name,callback) ->

    r.table("sessions").get(@ssid)(name).run(@db,callback)

  set: (name,value,cb) ->
    u = {}
    u[name] = value
    r.table("sessions").get(@ssid).update(u).run(@db,cb)


  @createSession: (db,callback) ->

    r.table("sessions").insert(
      created: Date.now()
    ).run(db,(err,inserted) ->
      if err? then l.error("Creating session failed: "+err)
      if err? then callback(err) else callback(null,new Session(inserted.generated_keys[0],db))
    )


module.exports = Session