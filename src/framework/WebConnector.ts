import {Floodway, Connector, Namespace, Utils, Action, IAction} from "../__entry";

import * as _ from "lodash";
import * as express from "express";
import * as fs from "fs";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as multer from "multer";
import {Server,createServer} from "http";


let upload = multer({ dest : path.join(process.cwd(),"./uploads")});



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
    }

    getServer(){
        return this.server;
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

        this.app.post("/upload/:fileToken",upload.single("upload"),(req,res) => {

            this.floodway.getRedis().hgetall(req.params.fileToken,(err,result) => {

                if(err != null || result == null){
                    res.status(403);
                    if(req.file.path != null){
                        try{
                            fs.unlinkSync(req.file.path);
                        }catch(e){
                            console.error("Deleting file failed...");
                        }
                    }
                    res.json({
                        status: false
                    })
                }else{
                    console.log(result);
                    res.json({
                        status: true,
                    })
                }

            });


        });

        this.server.listen(this.config.port);

    }

}