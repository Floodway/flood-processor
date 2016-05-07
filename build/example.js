var FloodProcessor, app;

FloodProcessor = require("./core");

app = new FloodProcessor({});

app.namespace({
  namespace: "test",
  actions: {
    helloWorld: {
      supportsUpdates: true,
      params: {},
      process: function(params) {
        var db, req;
        console.log("Processing...");
        req = params.req, db = params.db;
        req.send({
          data: "Hello world!"
        });
        return req.send({
          data: "burn!"
        });
      }
    },
    store: {
      supportsUpdates: false,
      params: {
        name: {
          type: "string"
        }
      },
      process: function(params) {
        var db, req;
        req = params.req, db = params.db;
        return req.session.set("data", req.params.name, function() {
          return req.send({
            stored: req.params.name
          });
        });
      }
    },
    retrieve: {
      supportsUpdates: false,
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
