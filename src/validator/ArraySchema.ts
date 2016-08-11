import {Type} from "./Type";
import * as _ from "lodash";
import {AsyncGroup, AsyncGroupCallback} from "../utils/AsyncGroup";
export class ArraySchema extends Type{

    private modeS: String;
    private childrenT: Type;
    private childrenLT: Type[];

    hasChildren(): boolean{
        return true;

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

    build(path: String = "root"): ArraySchema{
        if(this.modeS == "uniform"){
            this.childrenT.build(path+".child");
        }else{
            let i = 0;
            for(let child of this.childrenLT){
                child.build(path+"["+i+"]");
                i++
            }
        }
        return this;
    }

    validate(input: any[],callback: { (err: any,res: string): void }){
        let data: any[];
        if(_.isArray(input)){
            data  = input;
        }
        let group: AsyncGroup = new AsyncGroup((err: any,result: any) =>{
            if(err != null){
                err.path = this.path+"["+err.index+"]";
                delete err.index;
            }
            callback(err,result);
        });
        
        switch(this.modeS){
            case "uniform":
                // All children use the same validation Type
                for(let child of data){
                    group.add((done: AsyncGroupCallback) =>{
                        this.childrenT.validate(child,done);
                    });
                }
                break;
            case "unique":
                if(data.length <= this.childrenLT.length){
                    for(let index in data){
                        group.add((done: AsyncGroupCallback) =>{
                          this.childrenLT[index].validate(data[index],done);
                        });
                    }
                }else{
                    callback({
                        error: "arrayMismatch",
                        path: this.path
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