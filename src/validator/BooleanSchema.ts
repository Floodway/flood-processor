import {Type} from "./Type";
export class BooleanSchema extends Type{


    private inverseB: boolean;

    toJSON(){
        return {
            type: "boolean"
        }
    }

    validate(data: any,callback: { (err: any,res: boolean): void }){
        let item = data == true;

        if(this.inverseB) {
            item = !item;
        }

        return callback(null,item);

    }

    hasChildren(): boolean {
        return false;
    }

    inverse(value: boolean = true): BooleanSchema {
        this.inverseB = value;
        return this;

    }
}

