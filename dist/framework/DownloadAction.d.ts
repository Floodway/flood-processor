import { WebAction, Action } from "../__entry";
import { HttpMethod } from "./HttpMethod";
import { BodyMode } from "./BodyMode";
export declare class DownloadResult {
    path: string;
}
export declare abstract class DownloadAction<Params> extends Action<Params, DownloadResult> implements WebAction {
    abstract getName(): string;
    abstract getUrl(): string;
    abstract getBodyMode(): BodyMode;
    abstract useNamespaceRouter(): boolean;
    static isDownloadAction(input: any): input is DownloadAction<any>;
    getHttpMethods(): HttpMethod[];
    isDAction(): boolean;
}
