
import { Cookie, Action, Log, Floodway } from "../__entry";

import { Server } from "ws";
import *  as Socket from "ws";
import {Server as WebServer , ServerRequest } from "http";
import {DownloadAction} from "./DownloadAction";

export interface WebSocketConnectorConfig{

    server: WebServer

    port: number

    allowedOrigins: string[]


}

interface ConnectionInfo{
    origin: String,
    secure: boolean
}

interface VerifyClientCallback{
    (res: boolean): void;
}

export class WebSocketConnection{
    socket: Socket;

}

export class WebSocketConnector{

    connections: WebSocketConnection[];
    server: Server;
    config: WebSocketConnectorConfig;
    l: Log;

    floodway: Floodway;


    constructor(config: WebSocketConnectorConfig) {
        this.l = new Log("WebSocketConector");
        this.config = config;
    }

    start(floodway: Floodway){

        this.floodway = floodway;

        if(this.config.server == null){
            this.l.debug(`Using separate Server on port ${this.config.port}.`);

            this.server = new Server({
                port: this.config.port,
                verifyClient: this.verifyClient
            });

        }else{
            this.l.debug(`Using already created web-server on port ${  this.config.server.localPort }`);

            this.server = new Server({
                server: this.config.server,
                verifyClient: this.verifyClient.bind(this)
            });

        }

        this.connections = [];

        this.server.on("connection",this.handleConnection.bind(this));

    }

    getMeta(){
        return {
            name: "WebSocketConnector",
            additionalData: {
                port: this.config.port,
                usingServer: this.config.server != null,
                allowedOrigins: this.config.allowedOrigins
            }
        }
    }

    handleConnection(socket: Socket){

        let connection = {
            socket: socket
        };

        let ssid  =  Cookie.parse(socket.upgradeReq.headers.cookie)["flood-ssid"];

        this.connections.push(connection);

        let clientId: string;
        let requests: Action[] = [];

        socket.on("close",() => {
            for(let request of requests){
                if(request != null){
                    request.done();
                }
            }
            requests = [];

            this.connections = this.connections.filter((item) => {
                return item != connection;
            })

        });

        socket.on("message",(message) => {

            try{
                var data = JSON.parse(message.toString());
            }catch(error){
                this.l.debug("Invalid message: "+error);
            }

            if(data != null){

                if(data.requestId != null && data.messageType != null){
                    switch(data.messageType){

                        case "request":
                            if(this.floodway.namespaceExists(data.params.namespace)){

                                let namespace = this.floodway.getNamespaces()[data.params.namespace];

                                if(namespace.hasAction(data.params.action)){



                                    let ActionI = namespace.getAction(data.params.action);
                                    let action =  new ActionI();

                                    //  Don't make fileActions accessible. Else paths will be exposed.
                                    if(DownloadAction.isDownloadAction(action)){

                                        return socket.send(JSON.stringify({
                                            messageType: "error",
                                            requestId: data.requestId,
                                            params: {
                                                errorCode: "unknownAction",
                                                description: `The action  ${ data.params.action } does not exist!`
                                            }
                                        }));

                                    }

                                    if(data.params.params == null){
                                        data.params.params = {};
                                    }

                                    action.populate({
                                        params: data.params.params,
                                        namespace: namespace.getName(),
                                        requestId: data.requestId,
                                        sessionId: ssid,
                                        sendData: (data: any) =>{
                                            socket.send(JSON.stringify(data))
                                        }
                                    },this.floodway);

                                    requests.push(action);

                                    action.once("done",() => {
                                        try{
                                           socket.send(JSON.stringify({
                                               messageType: "done",
                                               requestId: data.requestId
                                           }));
                                        }catch(e){
                                            // THis is normal if the client disconnected unexpectedly.
                                        }

                                       requests = requests.filter((item) => {
                                           return item.requestId != action.requestId
                                       });
                                    });
                                }else{
                                    socket.send(JSON.stringify({
                                        messageType: "error",
                                        requestId: data.requestId,
                                        params: {
                                            errorCode: "unknownAction",
                                            description: `The action  ${ data.params.action } does not exist!`
                                        }
                                    }));
                                }


                            }else{

                                socket.send(JSON.stringify({
                                    messageType: "error",
                                    requestId: data.requestId,
                                    params: {
                                        errorCode: "unknownNamespace",
                                        description: `The namespace  ${ data.params.namespace } does not exist!`
                                    }
                                }));

                            }

                            break;

                        case "cancelRequest":

                            var requestsFiltered = requests.filter(function(req: Action){
                                return req.requestId == data.requestId;
                            });

                            for(let item of requestsFiltered){
                                item.emit("done");
                            }


                            break;

                        default:


                            socket.send(JSON.stringify({
                                messageType: "error",
                                requestId: data.requestId,
                                params: {
                                    errorCode: "invalidMessageType"
                                }
                            }));
                            break;
                    }

                }

            }


        })

    }
    

    verifyClient(info: {origin: string; secure: boolean; req: ServerRequest}): boolean{


        if(info.req.headers.hasOwnProperty("cookie")){

            var cookies = Cookie.parse(info.req.headers.cookie);

            if(
                cookies["flood-ssid"] != null &&
                cookies["flood-ssid"].length == 36
            ){

              if(this.config.allowedOrigins.length == 0 || this.config.allowedOrigins.indexOf("*") != -1){
                  return true;
              }

              if(this.config.allowedOrigins.indexOf(info.origin) != -1){
                  return true;
              }
            }
        }

        return false;
    }
}


