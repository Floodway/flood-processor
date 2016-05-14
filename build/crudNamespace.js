var r;

r = require("rethinkdb");

module.exports = function(crudParams) {
  var schemas;
  schemas = {};
  schemas[crudParams.name] = crudParams.schema;
  return {
    namespace: crudParams.name,
    schemas: schemas,
    actions: {
      create: {
        description: "Creates a new document of " + crudParams.name,
        supportsUpdates: false,
        params: crudParams.schema,
        result: {
          createdId: {
            type: "string",
            length: 36
          }
        },
        possibleErrors: {
          internalError: {
            description: "Occurs while saving the document"
          }
        },
        process: function(arg) {
          var db, fail, params, res;
          params = arg.params, res = arg.res, fail = arg.fail, db = arg.db;
          return r.table(crudParams.table).insert(params).run(db, function(err, ops) {
            if (err != null) {
              return fail.internalError();
            } else {
              return res({
                createdId: ops.generated_keys[0]
              });
            }
          });
        }
      },
      "delete": {
        description: "Deletes a document of " + crudParams.name,
        supportsUpdates: false,
        params: {
          id: {
            type: "string",
            length: 36
          }
        },
        possibleErrors: {
          notFound: {
            description: "The item specified was not found"
          }
        },
        result: {
          deletedCount: {
            type: "number"
          }
        },
        process: function(arg) {
          var db, fail, params, res;
          params = arg.params, res = arg.res, db = arg.db, fail = arg.fail;
          return r.table(crudParams.table).get(params.id)["delete"]().run(db, function(err, ops) {
            if (err != null) {
              return fail.notFound();
            } else {
              return res({
                deletedCount: 1
              });
            }
          });
        }
      },
      update: {
        description: "Deletes a document of " + crudParams.name,
        supportsUpdates: false,
        params: {
          id: {
            type: "string",
            length: 36
          },
          toUpdate: {
            type: "object",
            mode: "partial",
            useClass: crudParams.name,
            children: crudParams.schema
          }
        },
        possibleErrors: {
          internalError: {
            description: "Updating failed"
          }
        },
        result: {
          updated: {
            type: "number"
          }
        },
        process: function(arg) {
          var db, fail, params, res;
          params = arg.params, res = arg.res, db = arg.db, fail = arg.fail;
          return r.table(crudParams.table).get(params.id).update(params.toUpdate).run(db, function(err, ops) {
            if (err != null) {
              return fail.internalError();
            } else {
              return res({
                updated: ops.replaced
              });
            }
          });
        }
      },
      get: {
        description: "Get a document of " + crudParams.name,
        supportsUpdates: false,
        params: {
          id: {
            type: "string",
            length: 36
          }
        },
        possibleErrors: {
          notFound: {
            description: "Not found"
          }
        },
        result: crudParams.schema,
        process: function(arg) {
          var db, fail, params, res;
          params = arg.params, res = arg.res, db = arg.db, fail = arg.fail;
          return r.table(crudParams.table).get(params.id).run(db, function(err, doc) {
            if (err != null) {
              return fail.notFound();
            } else {
              return res(doc);
            }
          });
        }
      }
    }
  };
};
