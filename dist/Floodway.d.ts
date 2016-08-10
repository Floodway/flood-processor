import { Connector } from "./Connector";
import { Namespace } from "./Namespace";
import * as redis from "redis";
export declare class Floodway {
    connectors: Connector[];
    private logger;
    private redisClient;
    private running;
    private namespaces;
    constructor();
    start(): void;
    connectToRedis(): void;
    getRedisEvent(): redis.RedisClient;
    getConnectors(): Connector[];
    getRedis(): redis.RedisClient;
    getNamespace(name: string): Namespace;
    namespaceExists(name: string): boolean;
    getNamespaces(): {
        [path: string]: Namespace;
    };
    registerNamespace(namespace: Namespace): void;
    registerConnector(connector: Connector): void;
}
