import {Type} from "./Type";
import {AsyncGroup, AsyncGroupCallback, Runnable} from "../utils/AsyncGroup";
import {StringSchema} from "./StringSchema";


export enum ObjectMode{
    STRICT,
    LOOSE,
    SHORTEN,
    PARTIAL,
}

export class ObjectSchema extends Type{


    private childrenT: { [path:string]:Type };
    private className: string;
    private modeS: ObjectMode;

    constructor(className: string){
        super();
        this.childrenT = {};
        this.className = this.makeClassName(className);
        this.modeS = ObjectMode.LOOSE;
    }

    makeClassName(input: string){
        return input.charAt(0).toUpperCase()+input.slice(1);
    }

    modeToString(mode: ObjectMode){
        switch(mode){
            case ObjectMode.LOOSE:
                return "LOOSE";

            case ObjectMode.SHORTEN:
                return "SHORTEN";

            case ObjectMode.STRICT:
                return "STRICT";

        }
    }

    static isObjectSchema(input: any): input is ObjectSchema{
        return input.getClassName !== undefined;
    }

    toJSON(): any{

        let children = {};
        for(let key of Object.keys(this.childrenT)){

            children[key] = this.childrenT[key].toJSON();

        }

        return {
            type: "object",
            mode: this.modeToString(this.modeS),
            className: this.getClassName(),
            children
        }
    }

    hasChildren(): boolean {
        return true;
    }

    children(children: { [path:string]:Type}){

        this.childrenT = children;

        return this

    }

    getChild(name: string): Type{

        return this.childrenT[name];

    }

    getChildren(){
        return this.childrenT;
    }



    getClassName(){
        return this.className;
    }

    mode(mode: ObjectMode){

        this.modeS = mode;

        return this;
    }




    validate(item: any,callback: { (err: Object, res: Object): void },path="root"){
        let group : AsyncGroup;

        let newValue = {};

        if(item == null){
            return callback({error: "notPresent", path: path},null)
        }

        if(this.modeS == ObjectMode.STRICT){
            let valid = true;
            let missingKey;
            // Make sure the keys are the same
            for(let key of Object.keys(this.childrenT)){

                if(!item.hasOwnProperty(key)){
                    valid = false;
                    missingKey = key;
                    break;
                }

            }

            if(Object.keys(item).length != Object.keys(this.childrenT).length){
                valid = false;
            }


            if(!valid){
                return callback({
                    error: "invalidKeys",
                    description: "Not all or too many keys supplied.",
                    path,
                    missingKey
                },null)
            }

        }

        group = new AsyncGroup((err: any,r: any) => {
            if(err != null){
                callback(err,null);
            }else{

                if(this.modeS == ObjectMode.LOOSE){
                    callback(null,item);
                }else{
                    callback(null,newValue);
                }

            }
        });



        for(let key of Object.keys(this.childrenT)){
            if(this.modeS == ObjectMode.PARTIAL){
                if(item[key] == null){
                    if(this.childrenT[key].getDefault() != null){
                        group.add((callback: AsyncGroupCallback) => {
                            newValue[key] = this.childrenT[key].getDefault();
                        });
                    }
                    continue;
                }
            }

            group.add((callback: AsyncGroupCallback) => {



                this.childrenT[key].validate(item[key],(err: any, res: any) => {

                    if(err){
                        return callback(err,null);
                    }else{

                        if(this.modeS == ObjectMode.LOOSE){
                            // Replace value in original
                            item[key] = res;
                        }else{
                            newValue[key] = res;
                        }

                        callback(null,null);

                    }

                },path+"."+key)

            });


        }
        group.run();

    };

}