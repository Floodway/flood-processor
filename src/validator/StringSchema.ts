import { Type } from "./Type";
import * as _ from "lodash";
export class StringSchema extends Type{

  private lengthN: number;
  private minLengthN: number;
  private maxLengthN: number;

  private trimB: boolean;
  private toUpperCaseB: boolean;
  private toLowerCaseB: boolean;

  private oneOfS: string[];

  hasChildren(): boolean{
    return false;
  }

  toJSON(){
      return {
          type: "string",
          length: this.lengthN,
          minLength: this.minLengthN,
          maxLength: this.maxLengthN,
          trim: this.trimB,
          uppercase: this.toUpperCaseB,
          lowercase: this.toLowerCaseB
      }
  }

  validate(data: any,callback: { (err: any,res: string): void },path="root"){
    let item: string;
    if(_.isString(data)){
      item = data;
    }else{
      return callback({
        error: "notString",
        path
      },null);
    }



    if(this.lengthN != null){
      if(this.lengthN != item.length){
        return callback({
          error: "invalidLength",
          value: item,
          neededLength: this.lengthN,
          path: path
        },null);
      }
    }

    if(this.minLengthN != null){
      if(this.minLengthN > item.length){
        return callback({
          error: "tooShort",
          path: path
        },null);
      }
    }

    if(this.maxLengthN != null){
      if(this.maxLengthN < item.length){
        return callback({
          error: "tooLong",
          path: path
        },null);
      }
    }

    if(this.trimB){ item = item.trim(); }
    
    if(this.toLowerCaseB){ item = item.toLowerCase() }
    
    if(this.toUpperCaseB){ item = item.toUpperCase() }

    if(this.oneOfS != null){
      if(this.oneOfS.indexOf(item) == -1){
        return callback({ error: "invalidValue", allowedItems: this.oneOfS, path: path },null);
      }
    }

    callback(null,item);
    
  }

  oneOf(input: string[]){
    this.oneOfS = input;
    return this;
  }

  length(length: number): StringSchema { this.lengthN = length; return this }
  minLength(minLength: number): StringSchema { this.minLengthN = minLength; return this }
  maxLength(maxLength: number): StringSchema { this.maxLengthN = maxLength; return this }

  toUpperCase(uppercase: boolean=true): StringSchema { this.toUpperCaseB = uppercase; return this }
  toLowerCase(lowercase: boolean=true): StringSchema { this.toLowerCaseB = lowercase; return this }
  trim(trim: boolean=true): StringSchema { this.trimB = trim; return this }


}
