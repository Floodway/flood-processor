import { Middleware, Err, Namespace, Floodway } from "../__entry";
import { EventEmitter } from "events";
import { RedisClient } from "redis";
import { ClientTokens } from "./ClientTokens";
export interface ActionParams {
    sendData: {
        (data: any): void;
    };
    namespace: string;
    params: any;
    clientTokens: ClientTokens;
    listensForEvents?: boolean;
    requestId: string;
}
export interface IAction {
    new (): Action<any, any>;
}
export declare abstract class Action<Params, Result> extends EventEmitter {
    private namespace;
    private requestId;
    private clientTokens;
    private redis;
    private processedMiddleware;
    private sendData;
    paramsRaw: any;
    private params;
    toJson(): {
        name: string;
        description: string;
        middleware: any[];
        errors: Err[];
    };
    abstract getParamsClass(): Function;
    abstract getResultClass(): Function;
    getNamespace(): Namespace;
    setNamespace(namespace: Namespace): void;
    getRequestId(): string;
    getRedis(): RedisClient;
    getMiddleware(): Middleware<any>[];
    ignoreNamespaceMiddleware(): boolean;
    getParams(): Params;
    abstract getName(): string;
    getErrors(): Err[];
    abstract getDescription(): string;
    supportsUpdates(): boolean;
    getGroup(): string;
    constructor();
    setParams(params: any): void;
    populate(params: ActionParams, floodway: Floodway): void;
    getAllMiddleware(): Middleware<any>[];
    getPossibleErrors(): Err[];
    execute(): void;
    nextMiddleware(): void;
    done(): void;
    res(data: Result, final?: boolean): void;
    fail(errorCode: string, additionalData?: any): void;
    abstract run(): void;
}
