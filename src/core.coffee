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

FloodEventListener = require("flood-events").Client


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

        eventServer: config.eventServer ? "ws://localhost:3000/"

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

    shutdown: (reason) ->
      throw new Error(reason)



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
      # TODO: make recursive check of all functions ran.
      for name, namespace of @namespaces
        for actionName, action of namespace.actions
          for middleware in action.middleware
            if not @resolveMiddleware(name,middleware)? then @shutdown("Invalid middleware: '#{ middleware }'  used in #{name}.#{actionName}")
              
    start: ->
      
        @events = new FloodEventListener(@config.eventServer)
        
        @events.on("ready", =>

          @connectToDb( =>

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
        ,true)

    resolveMiddleware: (currentNamespace,name) ->
      
      if name.indexOf(".") ==  -1
        return @namespaces[currentNamespace].middleware[name]
      else
        split = name.split(".")
        return @namespaces[split[0]].middleware[split[1]]

    resolveAction: (currentNamespace,name) ->

      if name.indexOf(".") ==  -1
        # Using current namespace
        return @namespaces[currentNamespace].actions[name]
      else

        split = name.split(".")

        return @namespaces[split[0]].actions[split[1]]

    processRequest: (request) ->

      if not @namespaces[request.namespace]?
        request.failRaw(
          errorCode: "invalidNamespace"
          description: "The namespace '#{ request.namespace } is not registered!'"
        )
        return

      if not @namespaces[request.namespace].actions?
        request.failRaw(
          errorCode: "invalidAction"
          description: "The action '#{  request.action } is not registered in namespace '#{request.namespace}'!"

        )
        return

      toCleanUp = []

      onCleanUp = (fn) ->
        toCleanUp.push(fn)

      cleanUp = ->

        for fn in toCleanUp

          fn()

        request.emit("done")


      @runAction({
          params: request.params,
          namespace: request.namespace,
          name: request.action,
          session: request.session,
          onCleanUp
      },callback: (err,data) ->

          if err?
            request.failRaw(err)
            cleanUp()
          else

            request.send(data)

            if not request.supportsUpdates
              cleanUp()

      )

    runAction: ({ params, namespace, name, session, callback, onCleanUp }) ->

      # Resolve the action

      action = @resolveAction(namespace,name)

      if action?

        # Validate params
        validator.validate(params,action.params,(err,params) =>

          if err?
            callback(
              errorCode: "invalidParams"
              details: err
            )
          else

            # Run middleware

            @processMiddleware(

              middlewareList: action.middleware,
              session,
              params,
              namespace,
              callback: (err,params) =>

                if err? then return callback(err)

                # Run the action now

                toRemove = []

                listen = (name,callback) =>

                  toRemove.push({ name, callback })

                  @events.on(name,callback)



                onCleanUp( =>
                  for item in toRemove
                    @events.off(item.name,item.callback)
                )

                fail = {}

                for errorCode,meta of action.possibleErrors

                  fail[errorCode] = (moreInfo) ->
                    callback(_.extend(meta,moreInfo,{ errorCode: errorCode }))


                run = {}

                for actionName in action.calls

                  run[actionName] = (callback) =>

                    @runAction(
                      params,
                      namespace,
                      name: actionName,
                      session,
                      callback: callback
                      onCleanUp
                    )


                action.process(

                  session,
                  params,
                  listen,
                  run,
                  onCleanUp,
                  emit: @events.emit
                  res: (data) ->

                    validator.validate(data,action.result,(err,result) ->

                      if err?

                        callback(
                          errorCode: "invalidResult"
                          details: err
                        )

                      else
                        callback(null,result)
                    )
                )
            )
        )
      else

        callback(
          errorCode: "unknownAction"
        )

    processMiddleware: ({ middlwareList, session, params, callback , namespace }) ->

      if middlwareList.length == 0

        callback(null,params)

      currentMiddleware = 0

      next = (params) ->

        runMiddleware({ session, params , namespace, name: middlwareList[currentMiddleware], callback: (err,newParams) ->

          if err? then return callback(err)

          if currentMiddleware == middlwareList.length-1

            callback(null,newParams)

          else
            next(newParams)

        })

    runMiddleware: ({ session, params, callback, namespace, name }) ->

      middleware = @resolveMiddleware(namespace,name)

      # Middleware can't be null thanks to pre-running validation.

      fail = {}

      for errorCode, meta of middleware.possibleErrors

        fail[errorCode] = (moreInfo) ->

          callback(_.extend(meta,moreInfo,{ errorCode: errorCode }))

      validator.validate(params,middleware.params,(err,params) =>
        if err?

          callback(
            errorCode: "invalidParams"
            description: "The parameters passed to '#{  name }' were invalid. (NS: '#{ namespace }')"
            details: err
          )
        else
          # Now run the middleware

          middleware.process({ fail, on: @events.once, params , session , emit: @events.emit , callback: (params) -> callback(null,params) })

      )


module.exports = FloodProcessor











