WebSocket = require("ws")
EventEmitter = require("events").EventEmitter
RequestEventEmitter = require("./requestEventEmitter")
r =require("rethinkdb")
validator = require("flood-gate")

l = require("./log")
_ = require("lodash")
fs = require("fs")
WebInterface = require("./webInterface")
WebSocketInterface = require("./webSocketInterface")


class FloodProcessor extends EventEmitter

    
    @CrudNamespace: require("./crudNamespace")
    
    isFloodProcessor: -> true
    
    constructor: (config) ->

      @namespaces = {}

      @listeners = []

      @config =

        db: config.db ? {
          db: "floodway"
        }

        eventServer: config.eventServer ? {
          ip: "localhost"
          useWss: false
          port: 3000
        }

        interfaces: config.interfaces ? {

          http:
            enabled: true
            port: 4080

          ws:
            enabled: true
            allowedOrigins: ["*"]
            port: null
            useHtttp: true

        }


      @namespace(require("./mainNamespace"))
      @validateIntegrity()

    connectToDb: (callback) ->

      r.connect(
        @config.db
      ,(err,conn) =>
        if err? then @shutdown("Db Connection failed: "+err)
        @db = conn

        @checkDb()

        callback()
      )

    checkDb: ->
      l.log("Checking database compatibility")
      r.dbList().run(@db,(err,dbs) =>

        checkTables = =>
          r.db(@config.db.db).tableList().run(@db,(err,res) =>
            if err? then @shutdown("Database not compatible: #{ err }")

            requiredTables = ["sessions"]

            for table in requiredTables

              if res.indexOf(table) == -1

                l.success("Creating Table: #{ table }")
                r.db(@config.db.db).tableCreate(table).run(@db)


          )

        if dbs.indexOf(@config.db.db) == -1
          r.dbCreate(@config.db.db).run(@db,(err) =>

            if err?
              @shutdown("Database not compatible: #{ err }")
            else
              checkTables()

          )
        else

          checkTables()

      )


    emitEvent: (name,params) ->

      @eventSocket.send(JSON.stringify(
        messageType: "event"
        params: 
          event: name 
          params: params
      ))
      l.log("Sending event: "+name)
      for listener in @listeners
        do(listener) ->

          listener.emitEvent(name,params)
      

    processEventMessage: (data) ->

      if data.messageType? and data.params?

        switch data.messageType

          when "event"
            # Pass an event

            for listener in @listeners
              # Build event name

              listener.emitEvent(data.params.event,data.params.params)

          else

            l.error("Invalid messageType received: #{  data.messageType }")

      else

        l.error("Invalid message received: #{ data }")


    shutdown: (reason) ->

      # Todo: Cancel all requests.

      throw new Error(reason)

    sendEvent: (data) ->

      @eventSocket.send(JSON.stringify(data))

    namespace: (namespace) ->

      if not namespace.namespace? then @shutdown("No namespace provided")

      if @namespaces[namespace.namespace]? then @shutdown("Duplicate namespace used")

      if not namespace.actions? then namespace.actions = {}

      if not namespace.middleware? then namespace.middleware = {}

      # Global middleware
      if not namespace.globalMiddleware? then namespace.globalMiddleware = []

      for name, middleware of namespace.middleware

        if not middleware.description then @shutdown("No description for middleware: "+name)
        if not middleware.params? then middleware.params = {}


      for name, action of namespace.actions

        # Make sure it has a description
        if not action.description? then @shutdown("No description for action: "+name)
        if not action.supportsUpdates? then @shutdown("No update mode for action: "+name)

        if not action.params? then action.params = {}

        if not action.possibleErrors? then action.possibleErrors = []

        if not action.middleware? then action.middleware = []

        # Automatically add global middleware to this action.. Fancy!
        action.middleware = namespace.globalMiddleware.concat(action.middleware)


      @namespaces[namespace.namespace] = namespace

      l.success("Namespace registered: #{ namespace.namespace }")


    validateIntegrity: ->

      for name, namespace of @namespaces

        for actionName, action of namespace.actions

          for middleware in action.middleware

            if not @resolveMiddleware(name,middleware)? then @shutdown("Invalid middleware: '#{ middleware }'  used in #{name}.#{actionName}")


      
    start: ->


      # Connect to the event server
      @eventSocket = new WebSocket(
        "#{ if @config.eventServer.useWss then "wss://" else "ws://" }#{ @config.eventServer.ip }:#{ @config.eventServer.port }"
      )

      @eventSocket.on("error", (err) =>

        @shutdown("Unable to connect to event server")
      )

      @eventSocket.on("open", =>
        l.success("Connection to event server instantiated")

        # Send init

        @sendEvent(
          messageType: "init"
          params:
            type: "processor"
        )

        @connectToDb( =>

          @eventSocket.on("message",(message) =>
            try
              data = JSON.parse(message.toString())
            catch e
              l.error("Invalid message from Event server: #{ message.toString() }")

            if data? then @processEventMessage(data)
          )

          @eventSocket.on("close", ->
            @shutdown("Event Server shutdown")
          )




          if @config.interfaces.http.enabled

            @webInterface = new WebInterface(@config.interfaces.http.port,this)

          if @config.interfaces.ws.enabled

            @webSocketInterface = new WebSocketInterface(
              processor: @
              server: if @config.interfaces.ws.useHtttp then @webInterface.getServer() else null
              allowedOrigins: @config.interfaces.ws.allowedOrigins
            )

          @webInterface.listen()


        )

      )

      
      
      

    resolveMiddleware: (currentNamespace,name) ->

      if name.indexOf(".") ==  -1
        # Using current namespace
        return @namespaces[currentNamespace].middleware[name]
      else

        split = name.split(".")

        return @namespaces[split[0]].middleware[split[1]]


    processRequest: (request) ->

      # Check if namespace is valid
      if @namespaces[request.namespace]?

        # Check if action exists
        action = @namespaces[request.namespace].actions[request.action]
        if action?


          if action.supportsUpdates and not request.supportsUpdates

            request.failRaw(

              errorCode: "incompatibleProtocol"
              description: "The action '#{  request.action }' is not compatible with this protocol!"

            )

          else

            proceed = (request) =>

              # Validate parameters


              validator.validate(request.params,{ type: "object", children: action.params , mode: "shorten" },(err,params) =>
                if err? then return request.failRaw({ errorCode: "invalidParams", details: err })


                # We can call the request
                request.params = params

                errors = {}

                for errorCode, meta of action.possibleErrors

                  errors[errorCode] = (moreInfo) ->
                    request.failRaw(_.extend(meta,moreInfo,{ errorCode: errorCode }))


                result = (data,final=false) ->

                  validator.validate(data,{ type: "object", children: action.result, mode: "shorten" },(err,newData) =>

                    if err?
                      l.error("Invalid result for request: #{ request.namespace }.#{  request.action }\nData:",data,"\nError: \n",err)
                      request.failRaw(

                        errorCode: "internalError"

                      )
                    else

                      request.send(newData)

                  )

                  if final or not action.supportsUpdates then request.emit("done")



                # Event stuff
                events = new RequestEventEmitter(@,request.namespace)



                @listeners.push(events)

                request.once("done", =>
                  events.clearUp()
                  @listeners.splice(@listeners.indexOf(events),1)
                )
                


                action.process(
                  session: request.session
                  params: request.params
                  fail: errors
                  ev: events
                  res: result
                  db: @db
                )

              )

            if action.middleware.length != 0

              currentMiddleware = 0

              @nextMiddleware(request,currentMiddleware,action)


            else

              proceed(request)



        else

          request.failRaw(

            errorCode: "invalidAction"
            description: "The action '#{  request.action }' does not exist!"

          )

      else
        request.failRaw(
          errorCode: "invalidNamespace"
          description: "The namespace '#{  request.namespace }' does not exist!"

        )




    nextMiddleware: (request,currentMiddleware,action) =>

      middleware = @resolveMiddleware(request.namespace,action.middleware[currentMiddleware])
  
      validator.validate(request.params,{ type: "object", children: middleware.params , mode: "shorten" },(err,params) =>
  
        if err? then return request.failRaw({ errorCode: "invalidParams", details: err })
  
        params = request.params
  
        errors = {}
  
        for errorCode, meta of middleware.possibleErrors
  
          errors[errorCode] = (moreInfo) ->
            request.failRaw(_.extend(meta,moreInfo,{ errorCode: errorCode }))
            request.err = true
  
        request.fail = errors
  
  
  
  
        middleware.process(request,(newRequest) =>
          if not newRequest.err?
  
            if not newRequest? then newRequest = request
  
            if currentMiddleware != action.middleware.length-1
  
              currentMiddleware++
              @nextMiddleware(newRequest,currentMiddleware,action)
            else
  
  
              proceed(newRequest)
  
        )
      )
  
    generateDocumentation: ->
      if not fs.existsSync("./docs")
        fs.mkdirSync("./docs")
      for name, namespace of @namespaces

        file = "# Namespace: #{ name }\n\n --- \n"

        if namespace.description? then file+= "##Description: \n"+namespace.description+"\n\n"

        if namespace.middleware? and Object.keys(namespace.middleware).length != 0
          file += "##Middleware\n\n"

          for middlewareName, middleware of namespace.middleware

            file += "####{middlewareName} \n"

            file += middleware.description+"\n\n --- \n\n"

            if middleware.params?
              file += "####Parameters\n json```"+JSON.stringify(middleware.params)+"```\n"

            file += "####Possible errors \n"

            for errorCode, error of middleware.possibleErrors

              file += "**#{errorCode}**\n"
              if error.description?
                file += "\t*"+error.description.trim()+"*"

        if namespace.actions and Object.keys(namespace.actions).length != 0

          file += "##Actions\n\n"

          for actionName, action of namespace.actions

            file += "* ####{actionName} \n\n"

            file += "\t*"+action.description+"*\n"

            file += "\t* **Supports updates:** #{ if action.supportsUpdates then "Yes" else "No" } \n"

            if action.middleware? and action.middleware.length != 0
              file += "\t* **Middlware used:** \n"

              for middleware in action.middleware

                file += "\t\t* "+middleware+"\n"


            file += "\t* **Parameters:**\n\n \t\t```json\n"+JSON.stringify(action.params,null,4).split("\n").map((i)-> "\t\t"+i).join("\n")+"\n```\n"


            file += "\t* **Possible errors**:\n"

            if action.possibleErrors? and Object.keys(action.possibleErrors).length != 0



              for errorCode, error of action.possibleErrors

                file += "**#{errorCode}**\n"
                if error.description?
                  file += "\t*"+error.description.trim()+"*"
            else

              file+= "None\n"

        # Write to disk

        fs.writeFile("./docs/#{ name }.md",file)





module.exports = FloodProcessor











