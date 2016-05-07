# Please import :/
EventEmitter = require("events").EventEmitter
http = require("http")
cookie = require("cookie")
utils = require("./utils")
l = require("./log")
Session = require("./session")
url = require("url")
_ = require("lodash")
Request = require("./request")

class WebInterface extends EventEmitter


  constructor: (@port,@processor) ->

    @requests = []

    @server = http.createServer(@handleRequest)


  getServer: -> return @server


  listen: ->

    @server.listen(@port)

  handleRequest:  (req,res) =>


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

      if not params?

        params = {}

      # Check if we have a ssid cookie
      if req.headers.cookie?
        cookies = cookie.parse(req.headers.cookie)


        for name,value of cookies
          if name == "flood-ssid" and value.length == 36 then ssid = value

      # Extract namespace and action



      location = url.parse(req.url,true)


      split = location.pathname.split("/")
      split.shift()
      if split.length != 2
        l.error("Invalid url: "+split)
        return res.end(JSON.stringify({ messageType: "error", error: { errorCode: "invalidRequest" }}))


      namespace = split[0]
      action = split[1]



      # After construction a session object, this method is called




      constructRequest = (session) =>

        request = new Request(

          namespace: namespace
          action: action
          params: params
          session: session
          supportsUpdates: false
          sendData: (data) ->
            try
              res.end(JSON.stringify(data))
            catch e
              l.error("Error while sending data back to client: "+e)


        )

        @requests.push(request)

        @processor.processRequest(request)

        request.once("done", =>
          @requests.splice(@requests.indexOf(request),1)
        )

        req.once("close", ->
          request.emit("done")
        )


      # Check if session id is empty

      createSession = =>
        Session.createSession(@processor.db,(err,session) ->

          if err? then return res.end(JSON.stringify({ messageType: "error", error:{  errorCode: "internalError" }}))

          l.log("Setting header")

          res.setHeader("Set-Cookie",["flood-ssid=#{ session.ssid };Max-Age=#{ 2592000  };HttpOnly"])

          constructRequest(session)
        )


      if not ssid?
        # Create a new session
        createSession()

      else
        session = new Session(ssid,@processor.db)

        session.verify((err) ->
          if err?
            createSession()
          else
            constructRequest(session)
        )


    )



module.exports = WebInterface