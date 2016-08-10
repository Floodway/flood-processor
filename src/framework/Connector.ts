import { Floodway } from "../__entry";
/**
 * Connector
 */

export interface ConnectorMeta{
    name: string;
    additionalData: any;
}

export abstract class Connector {
    constructor() {

    }

    abstract start(floodway: Floodway)

    //abstract supportsEvents(): boolean;

    abstract getMeta(): ConnectorMeta;

}
