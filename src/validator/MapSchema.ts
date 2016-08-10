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


    validate(data: any,callback: AsyncGroupCallback){

        let result = {};

        let group = new AsyncGroup((err: any,res: any) => {

            if(err != null){

                callback(err,null);

            }else{

                callback(null,result);

            }

        });


        for(let key : string of Object.keys(data)){


            group.add((callback: AsyncGroupCallback) => {


                let validateItem = (key: string,item: any) => {


                    this.valueSchema.validate(item,(err: any,res: any) => {

                        if(err != null){

                            err.path = this.path+"["+key+"]";

                            return callback(err,null);
                        }


                        result[key] = item;

                        callback(null,null);


                    });


                };

                if(this.keySchemaT != null){

                    this.keySchemaT.validate(key,(err: any, res: any) =>{

                        if(err != null){
                            err.path = this.path+"["+key+"] (key)";
                            return callback(err,null)
                        }



                    })

                }

            });


        }



    }


}