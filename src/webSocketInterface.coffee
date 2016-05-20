WsServer      = require("ws").Server
EventEmitter  = require("events").EventEmitter
cookie        = require("cookie")
l             = require("./log")
Request       = require("./request")

###
  Websocket Interface 
  
  this interface can be used to connect via websockets to Floodway
  
  - Supports updates: yes 
  
  Request schema: 
  
  {
    messageType: "request"
    requestId: "uniqueString"
    params: {...} 
    namespace: "someNamespace" 
    action: "someAction" 
  }
  
  Cancel a request:
  
  {
    messageType: "cancelRequest"
    requestId: "something"
  }
  
  Server replies with:
  
  {
    messageType: "response"
    requestId: "uniqueString"
    data: { ... }
  }
  
  or 
  {
    messageType: "error"
    requestId: "uniqueString"
    error: {
        errorCode: "someErrorCode"
        ...other data...
    }
  }

  or

  {
    messageType: "done"
    requestId: "uniqueString"
  }

  Is sent after a message fails or is marked as done

###

class WebSocketInterface extends  EventEmitter

    constructor: (@config) ->

      # Keep track of all connections
      @connections = []

      l.log("Starting Websocket Interface")

      # Check if we use the same server as the http interface
      if @config.server?

        l.log("Using HTTP server")
        that = @
        @server = new WsServer(
          server: @config.server
          verifyClient: (i,c) -> that.verifyClient(i,c) # Weird bug in ws js requires this call
        )

      else
        # Construct a server
        l.log("Using standalone websocket server")

        @server = new WsServer(
          port: @config.port
          verifyClient: (i,c) -> that.verifyClient(i,c)
        )

      # Keep a reference to the processor
      @processor = @config.processor

      # Register a listener for connections
      @server.on("connection",@handleConnection)


    verifyClient: (info,callback) =>

      # Check if we have a cookie header
      if info.req.headers["cookie"]?
        # Parse cookies
        cookies = cookie.parse(info.req.headers.cookie)
        # Make sure the cookie is possibly a valid ssid
        if cookies["flood-ssid"]? and cookies["flood-ssid"].length == 36
          # Check the origin of the request.
          if @config.allowedOrigins.length == 0 or @config.allowedOrigins[0] == "*"
            return callback(true)

          else
            # Make sure the origin is matching the config
            if @config.allowedOrigins.indexOf(info.origin) != -1
              return callback(true)

      # Default to failing.
      callback(false,403,"requiresSessionId")

    handleConnection: (connection) =>

      # Get the session id. No need for checking. this is done in the verifyClient method
      ssid = cookie.parse(connection.upgradeReq.headers.cookie)["flood-ssid"]

      # Keep track of requests. This property is not linked to the connection as that can lead to exceptions
      requests = []
      
      
    
      connection.on("close", =>
        # Connection closed. Mark all requests as done and force them to clean up
        for request in requests
          # Weird bug, double check before iterating
          if request?
            request.emit("done")
        requests = []
      )


      connection.on("message", (message) =>

        try
          data = JSON.parse(message.toString())
        catch e
          l.error("Invalid message: "+e)
        # Check if parsing was successful
        if data?
          # Make sure we have a requestId and messageType
          if data.requestId? and data.messageType?

            switch data.messageType

              when "request"
                # Construct a request
                request =  new Request(

                  namespace: data.namespace
                  action: data.action
                  params: data.params
                  session: ssid
                  supportsUpdates: true
                  sendData: (toBeSent) ->
                    toBeSent.requestId = data.requestId

                    try
                      connection.send(JSON.stringify(toBeSent))

                    catch e
                      l.error("Error while sending data back to client: "+e)


                )

                # Add the requestId to the request as this protocol is async.
                request.requestId = data.requestId

                # Keep a reference to the request
                requests.push(request)

                # Process the request in the processor
                @processor.processRequest(request)

                # Delete the request reference. Not needed anymore
                request.once("done", =>
                  requests.splice(requests.indexOf(request),1)
                )

              when "cancelRequest"

                # Find request
                requestsFiltered = requests.filter((item) -> item.requestId == data.requestId)

                # Make sure we can even iterate
                if requestsFiltered.length != 0
                  # Mark the requests as done, forcing them to clean up
                  for item in requestsFiltered
                    item.emit("done")

              else
                # Try to report back to the client that something got messed up
                connection.send(JSON.stringify({
                  messageType: "error"
                  requestId: data.requestId
                  error:
                    errorCode: "invalidMessageType"
                }))
      )
      
      

    getServer: -> return @server

module.exports = WebSocketInterface