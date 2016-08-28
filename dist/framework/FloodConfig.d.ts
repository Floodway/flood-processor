import { WebConnectorConfig } from "./WebConnector";
import { WebSocketConnectorConfig } from "./WebSocketConnector";
export declare enum DebugLevel {
    DEBUG = 0,
    NORMAL = 1,
}
export interface FloodConfig {
    floodway: {
        debugLevel?: DebugLevel;
    };
    connectors: {
        web: WebConnectorConfig;
        ws: WebSocketConnectorConfig;
    };
}
