import {Floodway, Connector, Namespace, Utils, Action, IAction} from "../__entry";
import * as _ from "lodash";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import {Server,createServer} from "http";
import {FileEndPoints} from "./FileEndPoints";

export interface WebConnectorConfig {
    port:number;

}

export enum BodyMode{
    JSON,
    UrlEncoded

}

export enum HttpMethod{
    GET,
    POST,
    PATCH,
    DELETE,
    HEAD
}

export interface WebConfig {

    methods:HttpMethod[];
    url:string;
    bodyMode?:BodyMode;


}

export interface WebAction {
    getWebConfig():WebConfig
}

function isWebAction(action:any):action is WebAction {
    return action.getWebConfig !== undefined;
}

export class WebConnector extends Connector {

    private config:WebConnectorConfig;
    private app;
    private floodway: Floodway;
    private server: Server;
    private fileEndPoints: FileEndPoints;

    constructor(config: WebConnectorConfig) {
        super();
        this.config = config;
        this.app = express();
        this.app.use((req: express.Request,res: express.Response,next) => {

            res.header('Access-Control-Allow-Origin', 'http://localhost');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.app.use(cookieParser());

        this.server = createServer(this.app);
        this.fileEndPoints = new FileEndPoints();
    }

    getServer(){
        return this.server;
    }

    getApp(){
        return this.app;
    }

    getFloodway(){
        return this.floodway;
    }

    getMeta(){
        return {
            name: "WebConnector",
            additionalData: {
                port: this.config.port
            }
        }
    }

    handleRequest(namespace: Namespace,actionI:IAction, req:express.Request, res:express.Response) {

        let action: Action = new actionI();


        let params = _.extend(req.body,req.params,req.query);

        let ssid: string;



        if(req.cookies["flood-ssid"] == null){

            ssid = Utils.generateUUID();

            res.cookie("flood-ssid",ssid,{ httpOnly: true  , expires: new Date(Date.now() + 900000) })


        }else{
            ssid = req.cookies["flood-ssid"];

        }

        if(isWebAction(action)){
            action.populate({

                namespace: namespace.getName(),
                params: params,
                requestId: "web:"+Utils.generateUUID(),
                sessionId: ssid,
                sendData: (data: any) => {
                    res.json(data);

                }
            },this.floodway);


        }else{
            res.json({
                messageType: "error",
                requestId: "web:"+Utils.generateUUID(),
                error: {
                    errorCode: "internalError",
                    description: "The registered action is not compatible with this protocol"
                }
            });
            action.done();
        }


    }

    start(floodway:Floodway) {
        this.floodway = floodway;
        let namespaces = floodway.getNamespaces();
        for (let name of Object.keys(namespaces)) {

            let namespace = namespaces[name];

            for (let actionName of Object.keys(namespace.getActions())) {

                let actionI = namespace.getAction(actionName);

                let actionIC : Action = new actionI();

                let action:Action | WebAction = new actionI();



                if (isWebAction(action) && !actionIC.getMetaData().supportsUpdates) {


                    let config:WebConfig = action.getWebConfig();

                    for (let method of config.methods) {


                        switch (method) {

                            case HttpMethod.GET:


                                this.app.get(
                                    config.url,
                                    config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true}),
                                    this.handleRequest.bind(this,namespace,actionI)
                                );
                                break;

                            case HttpMethod.POST:

                                this.app.post(
                                    config.url,
                                    config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true}),
                                    this.handleRequest.bind(this,namespace,actionI)
                                );

                                break;

                            case HttpMethod.HEAD:

                                this.app.head(
                                    config.url,
                                    config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true}),
                                    this.handleRequest.bind(this,namespace,actionI)
                                );

                                break;

                            case HttpMethod.PATCH:

                                this.app.patch(
                                    config.url,
                                    config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true}),
                                    this.handleRequest.bind(this,namespace,actionI)
                                );

                                break;

                            case HttpMethod.DELETE:

                                this.app.delete(
                                    config.url,
                                    config.bodyMode == BodyMode.JSON ? bodyParser.json() : bodyParser.urlencoded({ extended: true}),
                                    this.handleRequest.bind(this,namespace,actionI)
                                );

                                break;


                        }

                    }


                }


            }

        }

        this.fileEndPoints.register(this);
        this.server.listen(this.config.port);
    }

}