import { Type, Action, Err } from "../__entry";
import { SchemaStore } from "flood-gate";

export interface MiddlewareMeta{
    name: string;
    description: string;
    errors: Err[];
    params: Type;
}
export abstract class Middleware<Params>{

    private action: Action<any,any>;
    private done: boolean;
    private processedMiddleware: number;

    public params: Params;

    abstract getName(): string;
    abstract getDescription(): string;

    abstract getParamsClass(): {new ():Params};

    public getErrors(): Err[]{
        return [];
    }

    public getMiddleware(): Middleware<any>[]{
        return [];
    }




    fail(errorCode: string,additionalData?: any){
        this.action.fail(errorCode,additionalData);
    }

    next(){
        if(!this.done){
            this.action.nextMiddleware();
            this.done = true;
        }else{
            console.error("FATAL: Middleware "+this.getName()+" called next twice! THIS IS A NOGO!");
        }
    }

    nextMiddleware(action: Action<any,any>){
        this.processedMiddleware++;
        if(this.getMiddleware().length == this.processedMiddleware){
            this.checkParams(action)
        }else{
            this.getMiddleware()[this.processedMiddleware].execute(action);
        }
    }

    checkParams(action: Action<any,any>){

        this.params = SchemaStore.populateSchema<Params>(this.getParamsClass(),action.paramsRaw,this.getGroup());

        SchemaStore.validate(this.params,(err,params) => {
           if(err != null){
               this.fail("invalidParams",err);
           }else{
               console.log(params);
               this.action.setParams(params);
               this.params = params;
               this.run(action);
           }
        });

    }
    public getGroup(): string{
        return null;
    }

    toJSON(){
        return {
            name: this.getName(),
            description: this.getDescription(),
            params: this.getParamsClass()["name"],
            middleware: this.getMiddleware().map((item) =>{  return  item.toJSON() })
        }
    }

    execute(action: Action<any,any>){
        this.action = action;
        if(this.getMiddleware().length == 0){
            this.checkParams(action);
        }else{
            this.nextMiddleware(action);
        }

    }

    abstract run(action: Action<any,any>);

}