
import {
    Type,Middleware,Err, Namespace, Floodway
} from "../__entry";


import * as _ from "lodash";
import { EventEmitter } from "events";
import { RedisClient } from "redis";
import {ObjectSchema} from "../validator/ObjectSchema";



export interface ActionParams{
    sendData: {(data: any): void};
    namespace: string;
    params: any;
    sessionId: string;
    listensForEvents?: boolean;
    requestId: string;

}

export interface ActionMeta{
    name: string;
    description: string;
    params: Type;
    exposeParams?: Type;
    result: Type;
    middleware: Middleware[];
    errors: Err[];
    supportsUpdates: boolean;
}

let defaultErrors = [
    {
        errorCode: "internalError",
        description: "An internal error occured while processing the request"
    },
    {
        errorCode: "invalidParams",
        description: "The parameters passed to the action where not compatible with it or the defined middleware"
    },
    {
        errorCode: "invalidResult",
        description: "The result of this action was not valid."
    }
];

export abstract class Action extends EventEmitter{

    abstract getMetaData(): ActionMeta;


    private sendData: {(data: any): void};
    public namespace: Namespace;
    public requestId: string;
    private middleware: Middleware[];
    public redis: RedisClient;
    public sessionId: string;
    public params: any;
    private processedMiddleware: number;

    constructor(){
        super();
    }

    makeClassName(input: string): string{
        return input.charAt(0).toUpperCase()+input.slice(1);
    }



    getParamsName(): string{
        let params: Type | ObjectSchema = this.getMetaData().params;
        if(ObjectSchema.isObjectSchema(params)){
            params.getClassName();
        }else{
            return this.makeClassName(this.getMetaData().name)+"Params";
        }

    }

    getResultName(): string{

        let result: Type | ObjectSchema = this.getMetaData().result;
        if(ObjectSchema.isObjectSchema(result)){
            result.getClassName();
        }else{
            return this.makeClassName(this.getMetaData().name)+"Result";
        }
    }

    populate(params: ActionParams,floodway: Floodway){
        this.sendData = params.sendData;
        this.params = params.params;
        this.sessionId = params.sessionId;
        this.processedMiddleware = -1;
        this.requestId = params.requestId;
        this.namespace = floodway.getNamespace(params.namespace);
        this.middleware = this.namespace.getMiddleware().concat(this.getMetaData().middleware);
        this.redis = params.listensForEvents ? floodway.getRedisEvent() : floodway.getRedis();

        if(this.middleware.length != 0){
            this.nextMiddleware();
        }else{
           this.execute();
        }
    }


    getPossibleErrors(): Err[]{
        // Get errors from  middleware,defaultErrors,and action errors
        let middlewareErrors: Err[] = [];

        this.middleware.map((middleware) => {
            let errs = middleware.getMetaData().errors.map((err) => {
                err.source = middleware.getMetaData().name;
                return err;
            });
           middlewareErrors = middlewareErrors.concat(errs);
        });

        return defaultErrors.concat(this.getMetaData().errors).concat(middlewareErrors);
    }


    execute(){
        this.getMetaData().params.validate(this.params,(err: any,result: any) => {
            if(err != null){
                this.fail("invalidParams",err)
            }else{
                this.params = result;
                this.run();
            }
        },"root(ActionParams)");
    }

    nextMiddleware(){
        this.processedMiddleware++;
        if(this.processedMiddleware == this.middleware.length){
            this.execute();
        }else{
            this.middleware[this.processedMiddleware].execute(this);
        }
    }
    done(){
        // This call is only for actions that actually support updates,
        // since it would get called automatically otherwise.
        this.emit("done");
    }

    // Called whenver an action has a result
    res(data: any,final= false){
        //  Check if the result is valid.
        this.getMetaData().result.validate(data,(err: any, res: any) =>{
            // Error checking
            if(err != null){
                this.fail("invalidResult",err);
            } else {
                // Send it!
                this.sendData({
                    messageType: "response",
                    requestId: this.requestId,
                    params: res
                });
            }
            // We're done here!
            if(!this.getMetaData().supportsUpdates || final){
                this.emit("done");
            }
        },"root(ActionResult)");
    }
    // Whenever something fails
    fail(errorCode: string,additionalData?: any){
        // Get all errors that this action can throw
        let possibleErrors = this.getPossibleErrors();
        let filtered = possibleErrors.filter((err: Err) => {
            return err.errorCode == errorCode;
        });
        //Make sure the error exists
        if(filtered.length >= 1){
            // Make a copy
            let err = _.extend({},filtered[0],{ additionalData });
            // Log the error to console (with additional Data)
            console.error(err);
            // Send back the error to the client
            this.sendData({
                messageType: "error",
                requestId: this.requestId,
                params: filtered[0]
            });
        }else{
            // Could not fail properly
            this.sendData({
                messageType: "error",
                requestId: this.requestId,
                params: {
                    errorCode: "internalError",
                    description: "The provided error is non-existent"
                }
            });
            console.error(`Could not fail properly. ${ errorCode } is not defined. `);
        }
        // A failed request is always done.
        this.emit("done");
    }

    abstract run(): void;
}


export interface IAction{
    new (): Action;
}