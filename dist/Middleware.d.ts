import { Type } from "./validator/Type";
import { Action } from "./Action";
import { Err } from "./Err";
export interface MiddlewareMeta {
    name: string;
    description: string;
    errors: Err[];
    params: Type;
}
export declare abstract class Middleware {
    private action;
    private done;
    abstract getMetaData(): MiddlewareMeta;
    getParamsName(): string;
    makeClassName(input: string): string;
    fail(errorCode: string, additionalData?: any): void;
    next(): void;
    execute(action: Action): void;
    abstract run(action: Action): any;
}
