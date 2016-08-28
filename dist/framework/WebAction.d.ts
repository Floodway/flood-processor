import { BodyMode } from "./BodyMode";
import { HttpMethod } from "./HttpMethod";
export interface WebAction {
    getUrl(): string;
    getBodyMode(): BodyMode;
    getHttpMethods(): HttpMethod[];
    useNamespaceRouter(): boolean;
}
