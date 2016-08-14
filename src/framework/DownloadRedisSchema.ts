export interface DownloadRedisSchema{
    path: string;
    action: string;
    namespace: string;
    params: string;
    deleteAfterDownload: boolean
}