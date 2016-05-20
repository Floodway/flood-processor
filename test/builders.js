var Action, Middleware, Namespace, assert, expect, ref, ref1;

ref = require("chai"), expect = ref.expect, assert = ref.assert;

ref1 = require("../build/builders"), Namespace = ref1.Namespace, Action = ref1.Action, Middleware = ref1.Middleware;

describe("Namespace", function() {
  describe("#withName", function() {
    return it("should set the namespace to the given value", function() {
      var ns;
      ns = new Namespace();
      ns.withName("foo");
      return assert.equal("foo", ns.tree.namespace);
    });
  });
  return describe("#withSchema", function() {
    it("should add a new schema", function() {
      var ns, schema;
      ns = new Namespace();
      schema = {
        foo: "bar"
      };
      ns.withSchema("schemaName", schema);
      return assert.equal(schema, ns.tree.schemas.schemaName);
    });
    it("should throw an exception if schema is already defined", function() {
      var ns, schema;
      ns = new Namespace();
      schema = {
        foo: "bar"
      };
      ns.withSchema("schemaName1", schema);
      return expect(function() {
        return ns.withSchema("schemaName1", schema);
      }).to["throw"](Error);
    });
    return it("should not throw an exception if schema is already defined and override is presnet", function() {
      var ns, schema;
      ns = new Namespace();
      schema = {
        foo: "bar"
      };
      ns.withSchema("schemaName1", schema);
      return expect(function() {
        return ns.withSchema("schemaName1", schema, true);
      }).to.not["throw"](Error);
    });
  });
});
