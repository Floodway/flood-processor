import { WebAction, Action, ObjectSchema, Type, FileCallback, Middleware, WebConfig } from "../__entry";
export declare abstract class DownloadAction extends Action implements WebAction {
    abstract getWebConfig(): WebConfig;
    abstract getName(): string;
    getMetaData(): {
        name: string;
        supportsUpdates: boolean;
        description: string;
        params: Type;
        result: ObjectSchema;
        middleware: Middleware[];
        errors: any[];
    };
    getMiddleware(): Middleware[];
    getErrors(): any[];
    abstract getFilePath(callback: {
        (err: any, path: string);
    }): any;
    abstract getParams(): Type;
    getResult(): ObjectSchema;
    getExpireTime(): Number;
    abstract getCallbackInfo(): FileCallback;
    run(): void;
}
