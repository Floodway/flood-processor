import {Action} from "./Action";
import {Middleware} from "./Middleware";
import {Err} from "./Err";
import {Type} from "../validator/Type";
import {BodyMode} from "./BodyMode";
import {HttpMethod} from "./HttpMethod";



export interface WebAction{

    getUrl(): string;

    getBodyMode(): BodyMode;

    getHttpMethods(): HttpMethod[];

    useNamespaceRouter(): boolean;

}
