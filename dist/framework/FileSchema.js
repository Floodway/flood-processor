"use strict";
var ObjectSchema_1 = require("../validator/ObjectSchema");
var StringSchema_1 = require("../validator/StringSchema");
var NumberSchema_1 = require("../validator/NumberSchema");
var FileSchema = new ObjectSchema_1.ObjectSchema("File").children({
    fieldname: new StringSchema_1.StringSchema(),
    originalname: new StringSchema_1.StringSchema(),
    encoding: new StringSchema_1.StringSchema(),
    mimetype: new StringSchema_1.StringSchema(),
    destination: new StringSchema_1.StringSchema(),
    filename: new StringSchema_1.StringSchema(),
    path: new StringSchema_1.StringSchema(),
    size: new NumberSchema_1.NumberSchema()
});
exports.FileSchema = FileSchema;
