import { Type, Action, Err } from "../__entry";
export interface MiddlewareMeta {
    name: string;
    description: string;
    errors: Err[];
    params: Type;
}
export declare abstract class Middleware<Params> {
    private action;
    private done;
    private processedMiddleware;
    params: Params;
    abstract getName(): string;
    abstract getDescription(): string;
    abstract getParamsClass(): {
        new (): Params;
    };
    getErrors(): Err[];
    getMiddleware(): Middleware<any>[];
    fail(errorCode: string, additionalData?: any): void;
    next(): void;
    nextMiddleware(action: Action<any, any>): void;
    checkParams(action: Action<any, any>): void;
    getGroup(): string;
    toJSON(): any;
    execute(action: Action<any, any>): void;
    abstract run(action: Action<any, any>): any;
}
