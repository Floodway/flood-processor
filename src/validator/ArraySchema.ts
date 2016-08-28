import {Type} from "./Type";
import * as _ from "lodash";
import *  as chalk from "chalk";
import {AsyncGroup, AsyncGroupCallback} from "../utils/AsyncGroup";
export class ArraySchema extends Type{

    private modeS: String;
    private childrenT: Type;
    private childrenLT: Type[];

    hasChildren(): boolean{
        return true;

    }

    static isArraySchema(input: Type): input is ArraySchema{
        return input.toJSON().type == "array";
    }
    
    toJSON(){
        return {
            type: "array",
            mode: this.modeS,
            children: this.childrenT != null ? this.childrenT.toJSON() : this.childrenLT.map((item) => {return item.toJSON() })
        }
    }


    getMode(){
        return this.modeS;
    }

    getChildSchema(){
        return this.childrenT;
    }
    
    child(child: Type){
        this.childrenT = child;
        this.modeS = "uniform";
        return this;

    }

    children(child: Type[]){
        this.childrenLT = child;
        this.modeS = "unique";
        return this;
    }


    validate(input: any[],callback: { (err: any,res: string): void },path="root"){
        let data: any[];
        if(_.isArray(input)){
            data  = input;
        }

        if(path == "root"){
            console.log(chalk.red("Warning: ArraySchema at Root. Please use an Object to ensure proper conversion to Java Classes."));
        }

        let group: AsyncGroup = new AsyncGroup(callback);
        
        switch(this.modeS){
            case "uniform":
                // All children use the same validation Type
                data.map((item,index) => {
                    group.add((done: AsyncGroupCallback) =>{
                        this.childrenT.validate(item,done,path+"["+index+"]");
                    });

                });
                break;
            case "unique":
                if(data.length <= this.childrenLT.length){
                    for(let index in data){
                        group.add((done: AsyncGroupCallback) =>{
                          this.childrenLT[index].validate(data[index],done,path+"["+index+"]");
                        });
                    }
                }else{
                    callback({
                        error: "arrayLengthMismatch",
                        path: path
                    },null)
                }
        }
        group.run();
    }
}

export enum ArrayMode{
    Index,
    Uniform
}