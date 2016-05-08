var FloodProcessor, app;

FloodProcessor = require("./core");

app = new FloodProcessor({});

app.namespace({
  namespace: "test",
  middleware: {
    deny: {
      params: {},
      description: "Requests with this middleware will never succeed",
      possibleErrors: {
        nope: {
          description: "Something went wrong!Nope!"
        }
      },
      process: function(request, callback) {
        request.fail.nope({
          nopeStuff: true
        });
        return callback(request);
      }
    }
  },
  actions: {
    helloWorld: {
      supportsUpdates: true,
      result: {
        data: {
          type: "string"
        }
      },
      description: "Prints out hello world",
      middleware: [],
      params: {},
      process: function(arg) {
        var ev, req, res;
        req = arg.req, res = arg.res, ev = arg.ev;
        return ev.on("test:saved", function(arg1) {
          var saved;
          saved = arg1.saved;
          return res({
            data: saved
          });
        });
      }
    },
    store: {
      supportsUpdates: false,
      description: "Stores a value in the session",
      params: {
        name: {
          type: "string"
        }
      },
      result: {
        stored: {
          type: "string"
        }
      },
      process: function(arg) {
        var ev, params, res, session;
        params = arg.params, ev = arg.ev, session = arg.session, res = arg.res;
        return session.set("data", params.name, function() {
          res({
            stored: params.name
          });
          return ev.emit("saved", {
            saved: params.name
          });
        });
      }
    },
    retrieve: {
      supportsUpdates: false,
      description: "Retrieves a value stored beforehand",
      params: {},
      process: function(arg) {
        var db, req;
        req = arg.req, db = arg.db;
        return req.session.get("data", function(err, data) {
          return req.send({
            retrieved: data
          });
        });
      }
    }
  }
});

app.namespace(FloodProcessor.CrudNamespace({
  schema: {
    username: {
      type: "string"
    },
    age: {
      type: "number"
    }
  },
  table: "people",
  name: "people"
}));
