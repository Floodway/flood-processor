import { Action, ObjectSchema, Middleware, WebAction, WebConfig, FileCallback } from "../__entry";
export declare abstract class UploadAction extends Action implements WebAction {
    abstract getWebConfig(): WebConfig;
    abstract getName(): string;
    abstract getCallbackInfo(): FileCallback;
    getParams(): ObjectSchema;
    getResult(): ObjectSchema;
    getMiddleware(): Middleware[];
    getMetaData(): {
        params: ObjectSchema;
        result: ObjectSchema;
        supportsUpdates: boolean;
        name: string;
        description: string;
        middleware: Middleware[];
        errors: any[];
    };
    run(): void;
}
