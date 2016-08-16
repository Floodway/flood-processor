import {Action} from "./Action";
import {Middleware} from "./Middleware";
import {Err} from "./Err";
import {Type} from "../validator/Type";
import {BodyMode} from "./BodyMode";
import {HttpMethod} from "./HttpMethod";
export interface WebMeta{
    name: string;
    description: string;
    params: Type;
    result: Type;
    errors: Err[];
    middleware: Middleware[];
}

export abstract class WebAction extends Action{

    constructor(){
        super();
    }

    getUrl(): string{
        return "/"+this.getMetaData().name
    }
    getBodyMode(): BodyMode{
        return BodyMode.JSON;
    }
    abstract getHttpMethods(): HttpMethod[]
    useNamespaceRouter(): boolean{
        return true;
    }

    allowUploads(): boolean{
        return false;
    }

    abstract getWebMetaData(): WebMeta;
    getMetaData(){

        let meta = this.getWebMetaData();

        return {
            supportsUpdates: false,
            name: meta.name,
            description: meta.description,
            params: meta.params,
            result: meta.result,
            errors: meta.errors,
            middleware: meta.middleware
        }

    }

    static isWebAction(action: any): action is WebAction{
        return action.getUrl !== undefined;
    }

}