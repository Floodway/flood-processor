import {WebAction,Action,ObjectSchema,StringSchema,Type,Utils,Middleware} from "../__entry";
import {HttpMethod} from "./HttpMethod";
export abstract class DownloadAction extends WebAction{

    abstract getName(): string;


    static isDownloadAction(input: any): input is DownloadAction{
        return input.isDAction !== undefined
    }


    getHttpMethods(){
        return [HttpMethod.GET]
    }

    isDAction(){
        return true;
    }

    getWebMetaData(){
        return {
            name: this.getName(),
            supportsUpdates: false,
            description: "Obtain a download token for a file",
            params: this.getParams(),
            exposeParams: this.getExposeParams(),
            result: new ObjectSchema("FilePath").children({
                path: new StringSchema()
            }),
            middleware: this.getMiddleware(),
            errors: this.getErrors()
        }
    }

    getMiddleware(): Middleware[]{
        return [];
    }


    abstract getParams(): Type;

    getExposeParams(): Type{
        return null;
    }


    getErrors(){
        return []
    }


    abstract run();



}