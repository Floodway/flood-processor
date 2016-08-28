
import {
    Type,Middleware,Err, Namespace, Floodway
} from "../__entry";


import * as _ from "lodash";
import { EventEmitter } from "events";
import { RedisClient } from "redis";
import { SchemaStore } from "flood-gate";

import {ClientTokens} from "./ClientTokens";



export interface ActionParams{
    sendData: {(data: any): void};
    namespace: string;
    params: any;
    clientTokens: ClientTokens;
    listensForEvents?: boolean;
    requestId: string;

}

export interface IAction {
    new (): Action<any,any>
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

export abstract class Action<Params,Result> extends EventEmitter{

    private namespace: Namespace;
    private requestId: string;
    private clientTokens: ClientTokens;
    private redis: RedisClient;
    private processedMiddleware: number;
    private sendData: { (data: any): void };
    public paramsRaw: any;

    private params: Params;


    toJson(){

        return {
            name: this.getName(),
            description: this.getDescription(),
            middleware: this.getAllMiddleware().map((middleware) => { return middleware.toJSON() }),
            errors: this.getPossibleErrors()
        }

    }

    abstract getParamsClass(): Function;
    abstract getResultClass(): Function;

    // Getters
    public getNamespace(): Namespace{ return this.namespace; }


    public setNamespace(namespace: Namespace){
        this.namespace = namespace;
    }

    public getRequestId(): string{ return this.requestId; }

    public getRedis(): RedisClient{ return this.redis; }

    public getMiddleware(): Middleware<any>[] {
        return [];
    }



    public ignoreNamespaceMiddleware(): boolean{ return false; }

    public getParams(): Params { return this.params; }

    abstract getName(): string;
    public getErrors(): Err[]{ return []; }
    abstract getDescription(): string;


    public supportsUpdates(): boolean{
        return false;
    }

    public getGroup(): string{
        return null;
    }


    constructor(){
        super();
    }



    public setParams(params: any){
        this.params = SchemaStore.populateSchema<Params>(this.getParamsClass(),params,this.getGroup());
    }


    populate(params: ActionParams,floodway: Floodway){

        //Callback
        this.sendData = params.sendData;

        this.paramsRaw = params.params;

        this.clientTokens = params.clientTokens;


        // Initial values
        this.processedMiddleware = -1;

        // Store requestId
        this.requestId = params.requestId;

        // Get reference to the namespace;
        this.namespace = floodway.getNamespace(params.namespace);


        this.redis = params.listensForEvents ? floodway.getRedisEvent() : floodway.getRedis();


        if(this.getAllMiddleware().length != 0){
            this.nextMiddleware();
        }else{
           this.execute();
        }
    }


    getAllMiddleware(): Middleware<any>[]{

        let middleware: Middleware<any>[] = [];

        if(!this.ignoreNamespaceMiddleware()){
            middleware = middleware.concat(this.getNamespace().getMiddleware());
        }

        middleware = middleware.concat(this.getMiddleware());

        return middleware;

    }
    getPossibleErrors(): Err[]{
        // Get errors from  middleware,defaultErrors,and action errors
        let middlewareErrors: Err[] = [];

        this.getAllMiddleware().map((middleware) => {
           middlewareErrors = middlewareErrors.concat(middleware.getErrors().map((err) => { err.source = middleware.getName(); return err; }));
        });


        return defaultErrors.concat(this.getErrors()).concat(middlewareErrors);
    }


    execute(){

        SchemaStore.validate(this.params,(err,res) => {

            this.params = res;

            if(err != null){ return this.fail("invalidParams",JSON.stringify(err)); }

            this.run();

        });

    }

    nextMiddleware(){
        this.processedMiddleware++;
        if(this.processedMiddleware == this.getAllMiddleware().length){
            this.execute();
        }else{
            this.getAllMiddleware()[this.processedMiddleware].execute(this);
        }
    }
    done(){
        // This call is only for actions that actually support updates,
        // since it would get called automatically otherwise.
        this.emit("done");
    }

    // Called whenver an action has a result
    res(data: Result,final= false){
        //  Check if the result is valid.

        SchemaStore.validate(data,(err,res) => {

            if(err != null){
                this.fail("invalidResult",err);
            } else {
                this.sendData({
                    messageType: "response",
                    requestId: this.requestId,
                    params: res
                });
            }

        });



        if(!this.supportsUpdates() || final){
            this.emit("done");
        }
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