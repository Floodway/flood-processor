import { Floodway, Connector, Namespace, IAction } from "../__entry";
import * as express from "express";
import { Server } from "http";
export interface WebConnectorConfig {
    port: number;
}
export declare class WebConnector extends Connector {
    private config;
    private app;
    private floodway;
    private server;
    constructor(config: WebConnectorConfig);
    getServer(): Server;
    getApp(): any;
    getFloodway(): Floodway;
    getMeta(): {
        name: string;
        additionalData: {
            port: number;
        };
    };
    handleRequest(namespace: Namespace, actionI: IAction, req: express.Request, res: express.Response): void;
    start(floodway: Floodway): void;
}
