"use strict";
var SchemaStore_1 = require("./SchemaStore");
function Child(options) {
    return function (c, name) {
        SchemaStore_1.schemaStore.addConstraint(c, name, {
            validate: function (item, callback, path) {
                if (item instanceof options.child) {
                    console.log("Item is a child!");
                    SchemaStore_1.schemaStore.validate(item, callback, options.group, path);
                }
                else {
                    callback({
                        errorCode: "invalidChild",
                        description: "The value passed as child was not valid!",
                        path: path + "." + c.constructor["name"] + "." + name
                    }, null);
                }
            },
            options: options
        });
    };
}
exports.Child = Child;
