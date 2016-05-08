FloodProcessor =  require("./core")


app = new FloodProcessor({})

app.namespace(
  namespace: "test"
  
  middleware: 
    
    deny: 
      params: {}
      description: "Requests with this middleware will never succeed"
      possibleErrors:
        nope:
          description: "Something went wrong!Nope!"

      
          
      process: (request,callback) ->

        request.fail.nope(
          nopeStuff: true
        )

        callback(request)
  
  actions:
    helloWorld:
      supportsUpdates: true
      result:
        data: { type: "string" }
      description: "Prints out hello world"
      middleware:[]
      params: {}
      
      
      process: ({ req , res ,ev }) ->

        ev.on("test:saved", ({ saved }) ->
          
          res(
            data: saved
          )


        )
        
        


    store:
      supportsUpdates: false
      description: "Stores a value in the session"
      params: {
        name: { type: "string"}
      }
      result:
        stored: { type : "string" }

      process: ({ params, ev, session,res }) ->


        session.set("data",params.name, ->
          res(
            stored: params.name
          )
          ev.emit("saved",{ saved: params.name })
        )

    retrieve:
      supportsUpdates: false
      description: "Retrieves a value stored beforehand"
      params: {}
      process: ({ req, db }) ->

        req.session.get("data",(err,data) ->
          req.send(
            retrieved: data
          )
        )

)

app.namespace(FloodProcessor.CrudNamespace(
  schema:
    username: { type: "string"}
    age: { type: "number"}
  table: "people"
  name: "people"
))


