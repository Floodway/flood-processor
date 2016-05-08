class RequestEventEmitter

  constructor: (@processor,@namespace) ->

    @listeners = {}

  on: (name,cb) ->
    if not @listeners[name]? then  @listeners[name] = []

    @listeners[name].push(cb)

  emit: (name,params,global=false) ->

    if not global
      @processor.emitEvent(@namespace+":"+name,params)
    else
      @processor.emitEvent("global:"+name,params)


  once: (name,cb) ->

    done = (params) ->
      cb(params)
      @off(name,this)


    @on(name,done)

  clearUp: () ->
    console.log "Cleanup..."
    @emitEvent("cleanUp")
    @listeners = {}

  emitEvent: (name,params) ->

    if @listeners[name]?

      @listeners[name].map((listener) ->
        listener(params)
      )


module.exports = RequestEventEmitter