import {Floodway, Connector, Namespace, Utils, Action, IAction} from "../__entry";
import * as _ from "lodash";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import {Server,createServer} from "http";
import *  as fs from "fs";
import *  as path from "path";
import {DownloadAction} from "./DownloadAction";
import * as multer from "multer";
import {WebAction} from "./WebAction";
import {HttpMethod} from "./HttpMethod";
import {BodyMode} from "./BodyMode";

let upload = multer({ dest : path.join(process.cwd(),"./uploads")});

export interface WebConnectorConfig {
    port:number;

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
        //this.fileEndPoints = new FileEndPoints();
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



        let params = _.extend(req.body,req.params,req.query,{ file: req.file });

        console.log(req.file);

        let ssid: string;



        if(req.cookies["flood-ssid"] == null){

            ssid = Utils.generateUUID();

            res.cookie("flood-ssid",ssid,{ httpOnly: true  , expires: new Date(Date.now() + 900000) })


        }else{
            ssid = req.cookies["flood-ssid"];

        }

        if(WebAction.isWebAction(action)){
            action.populate({

                namespace: namespace.getName(),
                params: params,
                requestId: "web:"+Utils.generateUUID(),
                sessionId: ssid,
                sendData: (data: any) => {

                    if(DownloadAction.isDownloadAction(action)){
                        console.log(data.params.path);
                        if(data.messageType == "response" && fs.existsSync(data.params.path)){
                            res.sendFile(data.params.path);
                        }else if(data.messageType == "error"){
                            res.status(500).end(JSON.stringify(data));
                        }else{
                            res.status(404).end("Error 404. Not found");
                        }
                    }else{
                        res.json(data);
                    }

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
            let nsRouter  = express.Router();

            // Register all actions
            for (let actionName of Object.keys(namespace.getActions())) {
                // Retrieve action and actionI
                let actionI = namespace.getAction(actionName);
                let action:Action | WebAction = new actionI();
                // Check if it's a webAction
                if (WebAction.isWebAction(action)) {
                    let router = action.useNamespaceRouter() ? nsRouter : this.app;
                    for (let method of action.getHttpMethods()) {

                        let url = action.getUrl();
                        let bodyMode = action.getBodyMode();
                        let useMulter = action.allowUploads();

                        if(bodyMode == BodyMode.JSON && useMulter){
                            throw new Error("Can not combine JSON Mode with uploads");
                        }

                        let args: any[] = [url];

                        if(useMulter){
                            args.push(upload.single("file"));
                            console.log("Applied Multer");
                        }else{
                            if(bodyMode == BodyMode.JSON){
                                args.push(bodyParser.json())
                            }else{
                                args.push(bodyParser.urlencoded({ extended: false}))
                            }
                        }

                        args.push(this.handleRequest.bind(this,namespace,actionI));

                        switch (method) {
                            case HttpMethod.GET:
                                router.get.apply(router,args);
                                break;
                            case HttpMethod.POST:
                                router.post.apply(router,args);
                                break;
                            case HttpMethod.HEAD:
                                router.head.apply(router,args);
                                break;
                            case HttpMethod.PATCH:
                                router.patch.apply(router,args);
                                break;
                            case HttpMethod.DELETE:
                                router.delete.apply(router,args);
                                break;
                        }
                    }
                }
            }
            this.app.use(namespace.getRootUrl(),nsRouter);

        }
        this.server.listen(this.config.port);
    }
}