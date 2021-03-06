import { Type, Action, Err } from "../__entry";
import {ObjectSchema} from "../validator/ObjectSchema";

export interface MiddlewareMeta{
    name: string;
    description: string;
    errors: Err[];
    params: Type;
}
export abstract class Middleware{

    private action: Action;
    private done: boolean;

    abstract getMetaData(): MiddlewareMeta;

    getParamsName(): string{
        let params = this.getMetaData().params;
        if(ObjectSchema.isObjectSchema(params)){
            return params.getClassName();
        }else{
            return this.makeClassName(this.getMetaData().name)+"Params"
        }
    }

    makeClassName(input: string){
        return input.charAt(0).toUpperCase+input.slice(1);
    }

    fail(errorCode: string,additionalData?: any){
        this.action.fail(errorCode,additionalData);
    }

    next(){
        if(!this.done){
            this.action.nextMiddleware();
            this.done = true;
        }else{
            console.error("FATAL: Middleware "+this.getMetaData().name+" called next twice! THIS IS A NOGO!");
        }
    }

    execute(action: Action){
        this.action = action;
        // Check the params

        this.getMetaData().params.validate(action.params,(err: any,newParams: any) => {
            if(err == null){
                action.params = newParams;
                this.run(action);
            }else{
                console.log(this.getMetaData().params.toJSON());
                action.fail("invalidParams",err);
            }

        },"root(Middleware: "+this.getMetaData().name+")");
    }

    abstract run(action: Action);

}