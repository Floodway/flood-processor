import {WebAction,Action,ObjectSchema,StringSchema,Type,Utils,Middleware} from "../__entry";
import {HttpMethod} from "./HttpMethod";
import {BodyMode} from "./BodyMode";

export class DownloadResult{

    path: string;

}

export abstract class DownloadAction<Params> extends Action<Params,DownloadResult> implements WebAction{

    abstract getName(): string;

    abstract getUrl(): string;

    abstract getBodyMode(): BodyMode;

    abstract useNamespaceRouter(): boolean;



    static isDownloadAction(input: any): input is DownloadAction<any>{
        return input.isDAction !== undefined
    }

    getHttpMethods(){
        return [HttpMethod.GET]
    }

    isDAction(){
        return true;
    }



}