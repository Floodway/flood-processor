WsServer = require("ws").Server
EventEmitter = require("events").EventEmitter
cookie =require("cookie")
l = require("./log")


class WebSocketInterface extends  EventEmitter

    constructor: (@config) ->

      l.log("Starting Websocket Interface")

      @connections = []

      if @config.server?

        # Use the server provided
        l.log("Using HTTP server")
        that = @
        @server = new WsServer(
          server: @config.server
          verifyClient: (i,c) -> that.verifyClient(i,c)
        )

      else

        l.log("Using standalone websocket server")

              

        @server = new WsServer(
          port: @config.port
          verifyClient: (i,c) -> that.verifyClient(i,c)
        )

      @processor = @config.processor


    verifyClient: (info,callback) =>
      # Check cookies
      console.log info.req.headers

      if info.req.headers["cookie"]?
        cookies = cookie.parse(info.req.headers.cookie)
        console.log cookies
        if cookies["flood-ssid"]? and cookies["flood-ssid"].length == 36
          console.log "Valid ssid"
          if @config.allowedOrigins.length == 0 or @config.allowedOrigins[0] == "*"
            console.log "Ignoring origin.."
            return callback(true)

          else

            if @config.allowedOrigins.indexOf(info.origin) != -1
              console.log "Valid origin"
              return callback(true)
          

      callback(false,403,"requiresSessionId")

    handleConnection: (connection) ->

      # Get ssid

      ssid = cookie.parse(connection.upgradeReq.headers.cookie)["flood-ssid"]

      # Construct a session

      connection.requests = []

      session =  new Session(ssid,@processor.db)

      session.verify((err) =>
        if err?
          connection.close(1008)
        else

          connection.on("message", (message) =>
            try 
              data = JSON.parse(message.toString())
            catch e 
              l.error("Invalid message: "+e)
              
            if data?
              
              if data.requestId? and data.messageType?
                switch data.messageType
                  
                  when "request"

                    request =  new Request(

                      namespace: data.namespace
                      action: data.action
                      params: data.params
                      session: session
                      supportsUpdates: true
                      sendData: (toBeSend) ->
                        toBeSend.requestId = data.requestId
                        try
                          connection.send(JSON.stringify(toBeSend))
                        catch e
                          l.error("Error while sending data back to client: "+e)


                    )

                    request.requestId = data.requestId

                    connection.requests.push(request)



                    @processor.processRequest(request)

                    request.on("done", =>
                      connection.requests.splice(@requests.indexOf(request),1)
                    )

                  when "cancelRequest"

                    # Find request
                    requests = connection.requests.filter((item) -> item.requestId == data.params.requestId)

                    if requests.length != 0

                      for item in requests
                        item.emit("done")

                      connection.send(JSON.stringify({
                        messageType: "response"
                        requestId: data.requestId
                        data:
                          terminatedRequests: requests.length
                      }))

                  else
                  
                    connection.send(JSON.stringify({
                      messageType: "error"
                      requestId: data.requestId
                      error:
                        errorCode: "invalidMessageType"
                    }))
                  
                
            

            
            
          )

      )


    getServer: -> return @server

module.exports = WebSocketInterface