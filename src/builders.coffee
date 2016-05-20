ensure = require("is_js")
_      = require("lodash")
class Namespace

  constructor: () ->
    @tree = {}

  withName: (name) ->
    @tree.namespace = name
    return @

  withGlobalMiddleware: (middleware,override=false) ->

    if override
      @tree.globalMiddleware = middleware
      return @
    else
      if not @tree.globalMiddleware? then @tree.globalMiddleware = []

      @tree.globalMiddleware =  @tree.globalMiddleware.concat(middleware)

  withGlobalProvider: (name,description,getGlobal,override=false) ->

    if not @tree.provideGlobals? then @tree.provideGlobals = {}

    if not override and @tree.provideGlobals[name]? then throw new Error("Global variable: "+name+ " is already configured")

    @tree.provideGlobals[name] =
        description: description
        process: getGlobal

    return @

  withGlobal: (globVar,as) ->

    if not @tree.globals? then @tree.globals = {}

    @tree.globals[globVar] = as

    return @
    
  withOnStart: (onStart,override=false) ->

    if @tree.onStart? and not override then throw  new Error("Trying to override startup function for "+@tree.namespace+". Use override=true to force")

    @tree.onStart = onStart

    return @

  withAction: (action) ->

    # Ensure action object exists now!
    if not @tree.actions? then @tree.actions = {}

    if @tree.actions[action.getName()]?

      throw new Error("Trying to implement action '#{ action.getName() }' twice!")

    else

      @tree.actions[action.getName()] = action

      return @

  withModifiedAction: (name,modify) ->

    if not @tree.actions[name]? then throw new Error("Can not modify action '#{ name }'. It does not exist!")

    # Modify the shit out of it!
    @tree.actions[name] = modify(@tree.actions[name])

    return @

  withMiddleware: (middleware,override=false) ->


    if not @tree.middleware? then @tree.middleware = {}

    if @tree.middleware[middleware.getName()]? and not override then throw new Error("Middleware '#{ middleware.getName() }' is already registered in this namespace. Re-name or force override")

    @tree.middleware[middleware.getName()] = middleware

    return @

  withSchema: (name,schema,override=false) ->

    if not @tree.schemas? then @tree.schemas = {}

    if @tree.schemas[name]? and not override then throw new Error("There's already a schema with name '#{ name }' defined in #{ @tree.namespace }. Re-name or force override.")

    @tree.schemas[name] = schema

    return @

  build: ->

    if not @tree.namespace? then throw new Error("No namespace defined")
    
    if @tree.middleware?
      for name,middleware of @tree.middleware

        @tree.middleware[name] = middleware.build()

    if @tree.actions?

      for name,action of @tree.actions

        @tree.actions[name] = action.build()

    return @tree
      

class Middleware

  constructor: (name) ->
    @name = name
    @tree = {}
  getName: -> return @name

  withParams: (params) ->
    @tree.params = params
    return @

  withValidationMode: (mode) ->
    @tree.validationMode = mode
    return @

  withGlobal: (globVar,as) ->
    
    if not @tree.globals? then @tree.globals = {}
    
    @tree.globals[globVar] = as 
    
    return @

  withProcess: (process) ->
    @tree.process = process
    return @


  build: -> return @tree



class Action

  constructor: () ->
    @tree = {}

  withName: (name) ->
    @name = name
    return @


  isPrivate: (boolean) ->
    @tree.isPrivate = boolean == true
    return @
  withUpdateMode: (updateMode) ->
    @tree.supportsUpdates = updateMode == true
    return @
  withDescription: (description) ->
    @tree.description = description
    return @
  withParams: (params) ->
    @tree.params = params
    return @
  withResult: (result) ->
    @tree.result = result
    return @


  withProcess: (process) ->
    @tree.process = process
    return @

  withError: (errorCode,description,meta) ->

    if not @tree.possibleErrors? then @tree.possibleErrors = {}

    @tree.possibleErrors[errorCode] = _.extend({ description },meta)

    return @

  withMiddleware: (middleware,override=false) ->
    if not @tree.middleware? then @tree.middleware = []

    if ensure.array(middleware)

      if override then @tree.middleware = middleware else

        @tree.middleware = @tree.middleware.concat(middleware)


    else if ensure.string(middleware)

      @tree.middleware.push(middleware)

    else
      trow new Error("Middleware must either be a string or an array")
    return @

  getName: -> return @name
  build: -> return @tree

module.exports = {

  Action,
  Middleware,
  Namespace

}