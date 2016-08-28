"use strict";
var SchemaStore_1 = require("./SchemaStore");
var _ = require("lodash");
function Str(options) {
    return function (c, name) {
        options = SchemaStore_1.makeDefault(options, {
            length: null,
            minLength: null,
            maxLength: null,
            toLowerCase: false,
            toUpperCase: false,
            trim: false,
            whitelist: null,
            blacklist: null
        });
        SchemaStore_1.schemaStore.addConstraint(c, name, {
            validate: function (item, callback, path) {
                var constructor = c.constructor;
                if (!_.isString(item)) {
                    return callback({
                        errorCode: "notString",
                        description: "Variable is not a string!",
                        path: path + "." + constructor.name + "." + name
                    });
                }
                if (options.toLowerCase) {
                    item = item.toLowerCase();
                }
                if (options.toUpperCase) {
                    item = item.toUppserCase();
                }
                if (options.trim) {
                    item = item.trim();
                }
                if (options.whitelist != null && options.whitelist.indexOf(item) == -1) {
                    return callback({
                        errorCode: "whitelistedValue",
                        description: "Only the following strings are allowed " + JSON.stringify(options.whitelist),
                        path: path + "." + constructor.name + "." + name
                    });
                }
                if (options.blacklist != null && options.blacklist.indexOf(item) != -1) {
                    return callback({
                        errorCode: "blacklistedValue",
                        description: "The following strings are not allowed " + JSON.stringify(options.blacklist),
                        path: path + "." + constructor.name + "." + name
                    });
                }
                if (options.length != null && item.length != options.length) {
                    return callback({
                        errorCode: "invalidLength",
                        description: "Only strings with the length of  " + options.length + " are allowed",
                        path: path + "." + constructor.name + "." + name
                    });
                }
                if (options.maxLength != null && item.length > options.maxLength) {
                    return callback({
                        errorCode: "tooLong",
                        description: "Only strings with a max. length of  " + options.maxLength + " are allowed",
                        path: path + "." + constructor.name + "." + name
                    });
                }
                if (options.minLength != null && item.length < options.minLength) {
                    return callback({
                        errorCode: "tooShort",
                        description: "Only strings with a min. length of  " + options.maxLength + " are allowed",
                        path: path + "." + constructor.name + "." + name
                    });
                }
                callback(null, item);
            },
            options: options
        });
    };
}
exports.Str = Str;
