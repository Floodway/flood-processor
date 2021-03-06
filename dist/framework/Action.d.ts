import { Type, Middleware, Err, Namespace, Floodway } from "../__entry";
import { EventEmitter } from "events";
import { RedisClient } from "redis";
export interface ActionParams {
    sendData: {
        (data: any): void;
    };
    namespace: string;
    params: any;
    sessionId: string;
    listensForEvents?: boolean;
    requestId: string;
}
export interface ActionMeta {
    name: string;
    description: string;
    params: Type;
    exposeParams?: Type;
    result: Type;
    middleware: Middleware[];
    errors: Err[];
    supportsUpdates: boolean;
}
export declare abstract class Action extends EventEmitter {
    abstract getMetaData(): ActionMeta;
    private sendData;
    namespace: Namespace;
    requestId: string;
    private middleware;
    redis: RedisClient;
    sessionId: string;
    params: any;
    private processedMiddleware;
    constructor();
    makeClassName(input: string): string;
    getParamsName(): string;
    getResultName(): string;
    populate(params: ActionParams, floodway: Floodway): void;
    getPossibleErrors(): Err[];
    execute(): void;
    nextMiddleware(): void;
    done(): void;
    res(data: any, final?: boolean): void;
    fail(errorCode: string, additionalData?: any): void;
    abstract run(): void;
}
export interface IAction {
    new (): Action;
}
