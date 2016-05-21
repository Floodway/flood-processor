
# Dependencies
ensure              = require("is_js")
EventEmitter        = require("events").EventEmitter
validator           = require("flood-gate")
WebInterface        = require("./webInterface")
WebSocketInterface  = require("./webSocketInterface")
FloodEventListener  = require("flood-events").Client
l                   = require("./log")
_                   = require("lodash")
fs                  = require("fs")
AsyncWait           = require("./asyncWait")

# These classes will be exported.
{ Action, Middleware, Namespace} = require("./builders")

class FloodProcessor extends EventEmitter


    @Action: Action
    @Middleware: Middleware
    @Namespace: Namespace
     
    isFloodProcessor: -> true
    
    constructor: (config) ->
      

      l.log("Floodway instance with version #{ require("../package.json")["version"] } created")
      
      @namespaces = {}

      @globals = {}

      @listeners = []

      @config =

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


      if @config.redis?
        @namespace(require("./redis"))

      @namespace(require("./mainNamespace"))
      @validateIntegrity()

    


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


          
        if not action.params? then action.params = {} else

          # Check for schema

          if ensure.string(action.params)

            # It's a schema

            if not namespace.schemas[action.params]? then @shutdown("Schema not defined for action:"+name+" schema: "+action.params)
            



        if not action.possibleErrors? then action.possibleErrors = {}
        if not action.middleware? then action.middleware = []
        if not action.calls? then action.calls = []

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

    convertSchemas: ->
      l.success("Converting schemas...")
      convert = (input,namespace) ->

        if ensure.string(input)
          # Schema
          if namespace.schemas[input]? then return namespace.schemas[input] else @shutdown("Invalid schema used: "+input)

        else
          

          if ensure.object(input)

            # Validation config
            if input.type? and ensure.string(input.type)


              if input.children? then input.children = convert(input.children,namespace)


              
              return input
              
            else
              for key,value of input 
                
                input[key] = convert(value,namespace)
                
              return input
              


      for name, namespace of @namespaces
        
        if namespace.schemas?
          
          for schemaName, schema of namespace.schemas 
            
            namespace.schemas[schemaName] = convert(schema,namespace)
          
        
        if namespace.middleware? 
            
          for middlewareName, middleware of namespace.middleware

            namespace.middleware[middlewareName].params = convert(middleware.params,namespace)


        if namespace.middleware?

          for actionName, action of namespace.actions
            
            namespace.actions[actionName].params = convert(action.params,namespace)
            namespace.actions[actionName].result = convert(action.result,namespace)




    start: ->

        # Convert all schemas present in namespaces

        @convertSchemas()

        # Create a connection to the event server

        @events = new FloodEventListener(@config.eventServer)


        @events.on("ready", =>

          # Start interfaces
          if @config.interfaces.http.enabled

            @webInterface = new WebInterface(@config.interfaces.http.port,this)

          if @config.interfaces.ws.enabled

            @webSocketInterface = new WebSocketInterface(
              processor: @
              server: if @config.interfaces.ws.useHtttp then @webInterface.getServer() else null
              allowedOrigins: @config.interfaces.ws.allowedOrigins
            )

          @webInterface.listen()

          @provideGlobals((err) =>
            if err? then @shutdown(err)
            @runInitCode()
          )

        ,true)



    resolveGlobals: (list,currentNamespace) ->


      result = {}

      for item, resName of list

        if item.indexOf(".") == -1

          # Use current namespace
          if @globals[currentNamespace]? and @globals[currentNamespace][item]?

            result[resName] = @globals[currentNamespace][item]

          else
            @shutdown("Unable to resolve global "+currentNamespace+"."+item)

        else

          ns = item.split(".")[0]
          globalVar = item.split(".")[1]

          if @globals[ns]? and @globals[ns][globalVar]?

            result[resName] = @globals[ns][globalVar]

          else
            @shutdown("Unable to resolve global "+item)

      return result







    populateGlobals: () ->

      for namespaceName, namespace of @namespaces

        if namespace.globals? then namespace.globals =  @resolveGlobals(namespace.globals,namespaceName)





    provideGlobals: (callback) ->

      asyncWait = new AsyncWait()

      for namespaceName, namespace of @namespaces
        do (namespaceName,namespace) =>
          if namespace.provideGlobals?

            @globals[namespaceName] = {}

            for varName,register of namespace.provideGlobals
              do(varName,register) =>
                asyncWait.addStep((done) =>

                  register.process({ config: @config  },(globalVar) =>
                    if not @globals[namespaceName]? then @globals[namespaceName] = {}
                    @globals[namespaceName][varName] = globalVar

                    done()

                  )

                )

      asyncWait.run( =>
        @populateGlobals()
        callback()
      )
          
          




    resolveMiddleware: (currentNamespace,name) ->
      
      if name.indexOf(".") ==  -1
        return @namespaces[currentNamespace].middleware[name]
      else
        split = name.split(".")
        return @namespaces[split[0]].middleware[split[1]]

    resolveAction: (currentNamespace,name) ->

      if name.indexOf(".") ==  -1
        # Using current namespace


        action = @namespaces[currentNamespace].actions[name]
      else

        split = name.split(".")

        action = @namespaces[split[0]].actions[split[1]]

      return action
  
    runInitCode: ->
      
      for name, namespace of @namespaces
        
        if namespace.onStart? then namespace.onStart({ events: @events, g: namespace.globals , processor: @ }) 
        
                
    processRequest: (request) ->

      if not @namespaces[request.namespace]?
        request.failRaw(
          errorCode: "invalidNamespace"
          description: "The namespace '#{ request.namespace } is not registered!'"
        )
        return

      if not @namespaces[request.namespace].actions? or not @namespaces[request.namespace].actions[request.action]? or @namespaces[request.namespace].actions[request.action].isPrivate
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

      request.once("done", ->
        cleanUp()
      )

      @runAction({
        params: request.params,
        namespace: request.namespace,
        name: request.action,
        session: request.session,
        onCleanUp,
        callback: (err, data) ->
          if err?
            request.failRaw(err)
            request.emit("done")
          else
            request.send(data)

            if not request.supportsUpdates
              request.emit("done")

      })

    runAction: ({ params, namespace, name, session, callback, onCleanUp }) ->

      # Resolve the action

      action = @resolveAction(namespace,name)

      if action?

        # Validate params
        
        # Check for schemas 

        validator.validate(params,{type: "object", mode: action.validationMode ? "shorten" ,children: action.params },(err,params) =>

          if err?
            callback(
              errorCode: "invalidParams"
              details: err
            )
          else

            # Run middleware

            @processMiddleware({

              middlewareList: action.middleware,
              session,
              params,
              namespace,
              callback: (err, params) =>
                if err? then return callback(err)

                # Run the action now

                toRemove = []

                listen = (name, callback) =>
                  toRemove.push({name, callback})

                  @events.on(name, callback)


                onCleanUp(=>
                  for item in toRemove
                    @events.off(item.name, item.callback)
                )

                fail = {}

                for errorCode,meta of action.possibleErrors

                  fail[errorCode] = (moreInfo) ->
                    callback(_.extend(meta, moreInfo, {errorCode: errorCode}))


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


                action.process({
                  session,
                  params,
                  listen,
                  g: @namespaces[namespace].globals,
                  fail,
                  db: @db,
                  run,
                  onCleanUp,
                  emit: @events.emit
                  res: (data) ->
                    validator.validate(data, {
                      type: "object",
                      children: action.result,
                      mode: "shorten"
                    }, (err, result) ->
                      if err?

                        callback(
                          errorCode: "invalidResult"
                          details: err
                        )

                      else
                        callback(null, result)
                    )
                })
            })
        )
      else

        callback(
          errorCode: "unknownAction"
        )

    processMiddleware: ({ middlewareList, session, params, callback , namespace }) ->

      if middlewareList.length == 0

        callback(null,params)

      currentMiddleware = 0

      next = (params) ->

        runMiddleware({ session, params , namespace, name: middlewareList[currentMiddleware], callback: (err,newParams) ->

          if err? then return callback(err)

          if currentMiddleware == middlewareList.length-1

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

      validator.validate(params,{type: "object", mode: middleware.validationMode ? "ensure" ,children: middleware.params },(err,params) =>
        if err?

          callback(
            errorCode: "invalidParams"
            description: "The parameters passed to '#{  name }' were invalid. (NS: '#{ namespace }')"
            details: err
          )
        else
          # Now run the middleware

          middleware.process({ fail, on: @events.once, params, g: @namespaces[namespace].globals , session , db: @db,  emit: @events.emit , callback: (params) -> callback(null,params) })

      )


module.exports = FloodProcessor











