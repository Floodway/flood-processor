
import { Namespace, Connector, Log } from "../__entry";

import  *  as redis from "redis";
import * as path from "path";
import { RedisClient} from "redis";

export class Floodway {

    connectors: Connector[];

    private logger: Log;


    private redisClient: RedisClient;
    private  running: boolean;

    private namespaces: { [path:string]:Namespace };

    constructor(){
        this.namespaces  = {};
        this.connectors = [];
        this.logger = new Log("Floodway");
        this.logger.success("Starting a new Floodway instance version "+require(path.join(process.cwd(),"./package.json"))["version"])
    }

    start(){

        this.connectToRedis();

        // Initialize all connectors
        this.connectors.forEach((connector) => {
            connector.start(this);
        });

        // Initialize all namespaces
        Object.keys(this.namespaces).forEach((namespaceKey) => {
            this.namespaces[namespaceKey].start(this);
        });

        // Make sure we can start.
        this.running = true;
    }

    // Connect to redis

    connectToRedis(){
        this.redisClient = redis.createClient();
    }

    getRedisEvent(){
        return redis.createClient();

    }

    getConnectors(){
        return this.connectors;
    }

    getRedis(){
        return this.redisClient;
    }


    // Get namespace
    getNamespace(name: string): Namespace{
        return this.namespaces[name];
    }

    // Check if a namespace with the defined name exists
    namespaceExists(name: string): boolean{
        return this.namespaces[name] != null;
    }
    // Get namespace by name
    getNamespaces(): { [path:string]:Namespace }{
        return this.namespaces;
    }
    // Register a new nanmespace
    registerNamespace(namespace: Namespace){

        // Make sure that namespaces are added before the system starts
        if(this.running){
            console.error("Could not add namespace. The system is already running.");
        }


        // Make sure there are no duplicate namespaces
        if(this.namespaceExists(namespace.getName())){
            throw Error(`Unable to register namespace with name  ${namespace.getName()}. A namespace with this name already exists.`);
        }else{
            this.namespaces[namespace.getName()] = namespace;
        }
    }

    // Register a new connector
    registerConnector(connector: Connector){

        this.connectors.push(connector);

    }

}
