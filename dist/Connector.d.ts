import { Floodway } from "./Floodway";
export interface ConnectorMeta {
    name: string;
    additionalData: any;
}
export declare abstract class Connector {
    constructor();
    abstract start(floodway: Floodway): any;
    abstract getMeta(): ConnectorMeta;
}
export interface EventConnector {
    sendEvent(namespace: string, name: string, params: any): any;
}
