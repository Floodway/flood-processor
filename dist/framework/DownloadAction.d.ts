import { WebAction, ObjectSchema, Type, Middleware } from "../__entry";
import { HttpMethod } from "./HttpMethod";
export declare abstract class DownloadAction extends WebAction {
    abstract getName(): string;
    static isDownloadAction(input: any): input is DownloadAction;
    getHttpMethods(): HttpMethod[];
    isDAction(): boolean;
    getWebMetaData(): {
        name: string;
        supportsUpdates: boolean;
        description: string;
        params: Type;
        result: ObjectSchema;
        middleware: Middleware[];
        errors: any[];
    };
    getMiddleware(): Middleware[];
    abstract getParams(): Type;
    getErrors(): any[];
    abstract run(): any;
}
