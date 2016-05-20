# Test for builders
{ expect, assert } = require("chai")

{ Namespace, Action, Middleware } = require("../build/builders")

describe("Namespace", ->

  describe("#withName", ->
    it("should set the namespace to the given value", ->
      ns = new Namespace()
      ns.withName("foo")
      assert.equal("foo",ns.tree.namespace)
    )
  )

  describe("#withSchema", ->

    it("should add a new schema", ->
      ns = new Namespace()
      schema = { foo: "bar" }
      ns.withSchema("schemaName",schema)

      assert.equal(schema,ns.tree.schemas.schemaName)


    )

    it("should throw an exception if schema is already defined", ->


      ns = new Namespace()
      schema = { foo: "bar" }
      ns.withSchema("schemaName1",schema)

      expect( ->
        ns.withSchema("schemaName1",schema)
      ).to.throw(Error)

    )

    it("should not throw an exception if schema is already defined and override is presnet", ->


      ns = new Namespace()
      schema = { foo: "bar" }
      ns.withSchema("schemaName1",schema)

      expect( ->
        ns.withSchema("schemaName1",schema,true)
      ).to.not.throw(Error)

    )

  )

)