r = require("rethinkdb")
module.exports = (crudParams) ->

  # Generate a CRUD namespace

  return {

    namespace: crudParams.name

    actions:

      create:
        description: "Creates a new document of "+crudParams.name
        supportsUpdates: false
        params: crudParams.schema
        result: {
          createdId: { type: "string" , length: 36}
        }
        possibleErrors:
          internalError:
            description: "Occurs while saving the document"

        process: ({params, res, fail ,db}) ->

          r.table(crudParams.table).insert(params).run(db,(err,ops) ->
            if err? then fail.internalError() else
              res(
                createdId: ops.generated_keys[0]
              )
          )



      delete:
        description: "Deletes a document of "+crudParams.name
        supportsUpdates: false
        params: {
          id: { type: "string", length: 36}
        }
        possibleErrors:
          notFound:
            description: "The item specified was not found"
        result: {
          deletedCount: { type: "number" }
        }
        process: ({ params, res, db, fail }) ->

          r.table(crudParams.table).get(params.id).delete().run(db,(err,ops) ->

            if err? then fail.notFound() else
              res(
                deletedCount: 1
              )

          )



      update:
        description: "Deletes a document of "+crudParams.name
        supportsUpdates: false
        params: {
          id: { type: "string", length: 36}
          toUpdate: {
            type: "object"
            mode: "partial"
            children: crudParams.schema
          }
        }
        possibleErrors:
          internalError:
            description: "Updating failed"
        result: {
          updated: {  type: "number" }
        }
        process: ({ params, res, db, fail}) ->
          r.table(crudParams.table).get(params.id).update(params.toUpdate).run(db,(err,ops) ->
            if err? then fail.internalError() else
              res(
                updated: ops.replaced
              )
          )


      get:
        description: "Get a document of "+crudParams.name
        supportsUpdates: false
        params: {
          id: { type: "string", length: 36}
        }
        possibleErrors:
          notFound:
            description: "Not found"
        result: crudParams.schema

        process: ({ params, res, db, fail }) ->

          r.table(crudParams.table).get(params.id).run(db,(err,doc) ->
            if err? then fail.notFound() else

              res(doc)

          )






  }