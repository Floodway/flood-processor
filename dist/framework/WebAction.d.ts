import { Action } from "./Action";
import { Middleware } from "./Middleware";
import { Err } from "./Err";
import { Type } from "../validator/Type";
import { BodyMode } from "./BodyMode";
import { HttpMethod } from "./HttpMethod";
export interface WebMeta {
    name: string;
    description: string;
    params: Type;
    result: Type;
    exposeParams?: Type;
    errors: Err[];
    middleware: Middleware[];
}
export declare abstract class WebAction extends Action {
    constructor();
    getUrl(): string;
    getBodyMode(): BodyMode;
    abstract getHttpMethods(): HttpMethod[];
    useNamespaceRouter(): boolean;
    allowUploads(): boolean;
    abstract getWebMetaData(): WebMeta;
    getMetaData(): {
        supportsUpdates: boolean;
        name: string;
        description: string;
        params: Type;
        exposeParams: Type;
        result: Type;
        errors: Err[];
        middleware: Middleware[];
    };
    static isWebAction(action: any): action is WebAction;
}
