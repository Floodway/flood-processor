EventEmitter =require("events").EventEmitter

class Request extends EventEmitter

  constructor: (params) ->
    
    {
      @namespace 
      @params 
      @action 
      @sendData 
      @supportsUpdates
      @session
    } = params

    @failed = false

    if @supportsUpdates

      @once("done", =>
        console.log "Request done.."
        @sendData(
          messageType: "done"
        )
      )

  send: (data) ->
    if not @failed
      @sendData(
        messageType: "response"
        data: data
      )

    if not @supportsUpdates then @emit("done")

  failRaw: (error) ->
    if not @failed
      @sendData(
        messageType: "error"
        error: error
      )
      @emit("done")
      @failed = true
      
module.exports = Request
  


