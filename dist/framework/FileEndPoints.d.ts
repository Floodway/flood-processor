import { WebConnector } from "./WebConnector";
import { DownloadRedisSchema } from "./DownloadRedisSchema";
export declare class FileEndPoints {
    private connector;
    private floodway;
    register(connector: WebConnector): void;
    fail(res: any, errorCode: any, description: any): void;
    onUpload(req: any, res: any): void;
    performDownload(req: any, res: any, downloadInfo: DownloadRedisSchema): void;
    onDownload(req: any, res: any): void;
}
