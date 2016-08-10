import { Log, Floodway } from "../__entry";
import { Server } from "ws";
import * as Socket from "ws";
import { Server as WebServer, ServerRequest } from "http";
export interface WebSocketConnectorConfig {
    server: WebServer;
    port: number;
    allowedOrigins: string[];
}
export declare class WebSocketConnection {
    socket: Socket;
}
export declare class WebSocketConnector {
    connections: WebSocketConnection[];
    server: Server;
    config: WebSocketConnectorConfig;
    l: Log;
    floodway: Floodway;
    constructor(config: WebSocketConnectorConfig);
    start(floodway: Floodway): void;
    getMeta(): {
        name: string;
        additionalData: {
            port: number;
            usingServer: boolean;
            allowedOrigins: string[];
        };
    };
    handleConnection(socket: Socket): void;
    verifyClient(info: {
        origin: string;
        secure: boolean;
        req: ServerRequest;
    }): boolean;
}
