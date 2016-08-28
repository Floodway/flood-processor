import {Type} from "./Type";
import {StringSchema} from "./StringSchema";
import {AsyncGroup, AsyncGroupCallback} from "../utils/AsyncGroup";
export class MapSchema extends Type{


    private keySchemaT: StringSchema;
    private valueSchema: Type;


    toJSON(){
        return {
            type: "mapSchema",
            keySchema: this.keySchemaT.toJSON(),
            valueSchema: this.valueSchema.toJSON()
        }
    }

    static isMapSchema(input: Type): input is MapSchema{
        return input.toJSON().type == "mapSchema";
    }


    hasChildren(): boolean{
        return true;
    }


    keySchema(schema: StringSchema): MapSchema{

        this.keySchemaT = schema;

        return this;

    }

    valueSchema(schema: Type): MapSchema{

        this.valueSchema = schema;

        return this;
    }


    validate(data: any,callback: AsyncGroupCallback,path="root"){

        let result = {};

        let group = new AsyncGroup(callback);


        for(let key : string of Object.keys(data)){


            group.add((callback: AsyncGroupCallback) => {


                let validateItem = (newKey: string,item: any) => {


                    this.valueSchema.validate(item,(err: any,res: any) => {

                        if(err != null){
                            return callback(err,null);
                        }

                        result[newKey] = item;

                        callback(null,null);


                    },path+"["+key+"]");


                };

                if(this.keySchemaT == null){
                    validateItem(key,data[key]);
                }else{
                    this.keySchemaT.validate(key,(err: any, res: any) =>{

                        if(err != null){
                            return callback(err,null)
                        }
                        validateItem(res,data[key]);
                    })
                }

            });


        }



    }


}