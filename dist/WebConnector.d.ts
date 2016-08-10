import { Connector } from "./Connector";
import * as express from "express";
import { Floodway } from "./Floodway";
import { Namespace } from "./Namespace";
import { IAction } from "./Action";
import { Server } from "http";
export interface WebConnectorConfig {
    port: number;
}
export declare enum BodyMode {
    JSON = 0,
    UrlEncoded = 1,
}
export declare enum HttpMethod {
    GET = 0,
    POST = 1,
    PATCH = 2,
    DELETE = 3,
    HEAD = 4,
}
export interface WebConfig {
    methods: HttpMethod[];
    url: string;
    bodyMode?: BodyMode;
}
export interface WebAction {
    getWebConfig(): WebConfig;
}
export declare class WebConnector extends Connector {
    private config;
    private app;
    private floodway;
    private server;
    constructor(config: WebConnectorConfig);
    getServer(): Server;
    getMeta(): {
        name: string;
        additionalData: {
            port: number;
        };
    };
    handleRequest(namespace: Namespace, actionI: IAction, req: express.Request, res: express.Response): void;
    start(floodway: Floodway): void;
}
