import {Type} from "./Type";
export class NumberSchema extends Type{


    private allowDecimalsB: boolean;
    private roundB: boolean;
    private floorB: boolean;
    private ceilB: boolean;

    private minN: Number;
    private maxN: Number;
    private blackListN: Number[];
    private whiteListN: Number[];

    hasChildren(): boolean{
        return false;
    }

    toJSON(){
        return {
            type: "number",
            allowDecimals: this.allowDecimalsB,
            round: this.roundB,
            floor: this.floorB,
            ceil: this.ceilB,
            min: this.minN,
            max: this.maxN,
            blacklist: this.blackListN,
            whitelist: this.whiteListN
        }
    }

    validate(data: any,callback: { (err: any,res: string): void },path="root"){
        let item;
        try{
            item = Number(data);
        }catch(e){
            callback({
                error: "notNumber",
                path: path
            },null);
        }

        if(item != null){

            // Make sure we didn't already call-back in case of try-catch error

            if(this.roundB){
                item = Math.round(item);
            }
            if(this.floorB){
                item = Math.floor(item)
            }
            if(this.ceilB){
                item = Math.ceil(item);
            }

            if(this.blackListN != null){
                if(this.blackListN.indexOf(item) != -1){
                    return callback({
                        error: "invalidValue",
                        disallowedItems: this.blackListN,
                        path
                    },null);
                }
            }

            if(this.whiteListN != null){
                if(this.whiteListN.indexOf(item) == -1){
                    return callback({
                        error: "invalidValue",
                        allowedItems: this.whiteListN,
                        path
                    },null);
                }
            }

            if(this.minN != null){
                if(item < this.minN){
                    return callback({
                        error: "tooSmallValue",
                        min: this.minN,
                        path
                    },null);
                }

            }

            if(this.maxN != null){
                if(item > this.maxN){
                    return callback({
                        error: "tooBigValue",
                        max: this.maxN,
                        path
                    },null);
                }
            }


        }
        callback(null,item);
    }

    allowsDecimals(){
        return this.allowDecimalsB;
    }

    ceil(value: boolean): NumberSchema{
        this.ceilB = value;
        return this;
    }

    floor(value: boolean): NumberSchema{
        this.floorB = value;
        return this;
    }

    round(value: boolean): NumberSchema{
        this.roundB = value;
        return this;
    }

    allow(values: Number[]): NumberSchema{
        this.whiteListN = values;
        return this;
    }

    disallow(values: Number[]): NumberSchema{
        this.blackListN = values;
        return this;
    }
}