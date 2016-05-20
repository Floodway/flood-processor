EventEmitter    = require("events").EventEmitter
http            = require("http")
cookie          = require("cookie")
utils           = require("./utils")
l               = require("./log")
url             = require("url")
Request         = require("./request")
uuid            = require("node-uuid")
###

  WebInterface

  - Supports updates: false




###
class WebInterface extends EventEmitter


  constructor: (@port,@processor) ->

    @requests = []

    @server = http.createServer(@handleRequest)


  getServer: -> return @server

  listen: -> @server.listen(@port)


  handleRequest: (req,res) =>


    # Parse the body
    body = ""

    req.on("data",(chunk) ->
      body += chunk.toString()
    )

    req.on("end", =>

      # Convert body to json
      if body.length != 0
        try
          params = JSON.parse(body)

        catch e
          l.error(e)

      # End the request, since no parameters were passed.
      if not params?
        return res.end(JSON.stringify({ messageType: "error", error: { errorCode: "noParameters" }}))

      # Check if we have a ssid cookie
      if req.headers.cookie?
        cookies = cookie.parse(req.headers.cookie)

        if cookies["flood-ssid"]? and cookies["flood-ssid"].length == 36

          ssid = cookies["flood-ssid"]

      console.log ssid

      if not ssid?

        # Generate a new ssid
        ssid = uuid.v4()


        res.setHeader("Set-Cookie",["flood-ssid=#{ ssid };Max-Age=#{ 2592000  };HttpOnly"])





      # Extract namespace and action -> requests follow scheme /namespace/action
      location = url.parse(req.url,true)

      split = location.pathname.split("/")
      split.shift()

      if split.length != 2
        l.error("Invalid url: "+split)
        return res.end(JSON.stringify({ messageType: "error", error: { errorCode: "invalidRequest" }}))




      # Construct the request
      namespace = split[0]
      action = split[1]

      request = new Request(

        namespace: namespace
        action: action
        params: params
        session: ssid
        supportsUpdates: false
        sendData: (data) ->
          try
            res.end(JSON.stringify(data))
          catch e
            l.error("Error while sending data back to client: "+e)


      )


      # Keep a reference to the request
      @requests.push(request)

      # Process the request
      @processor.processRequest(request)

      # Delete reference to the request
      request.once("done", =>
        @requests.splice(@requests.indexOf(request),1)
      )

      # Cancel the request when the connection is closed unexpectedly
      req.once("close", ->
        request.emit("done")
      )


    )




module.exports = WebInterface