import { Floodway } from "../__entry";
export interface ConnectorMeta {
    name: string;
    additionalData: any;
}
export declare abstract class Connector {
    constructor();
    abstract start(floodway: Floodway): any;
    abstract getMeta(): ConnectorMeta;
}
