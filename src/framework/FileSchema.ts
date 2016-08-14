
import {ObjectSchema} from "../validator/ObjectSchema";
import {StringSchema} from "../validator/StringSchema";
import {NumberSchema} from "../validator/NumberSchema";

let FileSchema = new ObjectSchema().children({
    fieldname: new StringSchema(),
    originalname: new StringSchema(),
    encoding: new StringSchema(),
    mimetype: new StringSchema(),
    destination: new StringSchema(),
    filename: new StringSchema(),
    path: new StringSchema(),
    size: new NumberSchema()
}).build("File");

export { FileSchema };

