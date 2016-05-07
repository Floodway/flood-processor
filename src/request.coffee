EventEmitter =require("events").EventEmitter

class Request extends EventEmitter

  ###
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

  ###

  constructor: (params) ->
    
    {
      @namespace 
      @params 
      @action 
      @sendData 
      @suppportsUpdates
      @session
    } = params

    @failed = false

  send: (data) ->
    if not @failed
      @sendData(
        messageType: "response"
        data: data
      )

    if not @suppportsUpdates then @emit("done")

  failRaw: (error) ->
    if not @failed
      @sendData(
        messageType: "error"
        error: error
      )
      @emit("done")
      @failed = true
      
module.exports = Request
  


