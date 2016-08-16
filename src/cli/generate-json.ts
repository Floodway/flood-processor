#!/usr/bin/env node
import *  as fs from "fs";
import * as path from "path";

import {BodyMode, HttpMethod, WebAction, Action} from "../__entry";

function isWebAction(action:any):action is WebAction {
    return action.getWebConfig !== undefined;
}

function isAction(action: any): action is Action{
    return action.getMetaData !== undefined;
}

export default (main,packageJson,writeToFile=false) => {
    if(main != null){
        if(main.getNamespaces != null){
            let namespaces = main.getNamespaces();


            let namespaceResult = [];


            for(let namespaceName of Object.keys(namespaces)){

                let namespace = namespaces[namespaceName];

                let actions = [];

                for(let key of Object.keys(namespace.getActions())){


                    let actionI  = namespace.getActions()[key];
                    let action: Action | WebAction = new actionI();

                    let meta;
                    let webStuff;

                    if(isAction(action)){
                        meta = action.getMetaData();
                    }

                    if(isWebAction(action)){


                        let res = {
                            methods: [],
                            path: action.getUrl(),
                            bodyMode: action.getBodyMode() == BodyMode.JSON ? "JSON" : "UrlEncoded"
                        };

                        action.getHttpMethods().map((method) => {
                            switch(method){
                                case HttpMethod.DELETE:
                                    res.methods.push("DELETE");
                                    break;
                                case HttpMethod.GET:
                                    res.methods.push("GET");
                                    break;
                                case HttpMethod.PATCH:
                                    res.methods.push("PATH");
                                    break;
                                case HttpMethod.POST:
                                    res.methods.push("POST");
                                    break;
                                case HttpMethod.HEAD:
                                    res.methods.push("HEAD");
                                    break;
                            }
                        });

                        webStuff = res;

                    }


                    if(isAction(action)){

                        actions.push({
                            name: meta.name,
                            description: meta.description,
                            middleware: meta.middleware.map((item) =>{
                                let res = item.getMetaData();

                                res.params = {
                                    schema: res.params.toJSON(),
                                    name: item.getParamsName()
                                };
                                return res;
                            }),
                            possibleErrors: meta.errors,
                            supportsUpdates: meta.supportsUpdates,
                            webConfig: webStuff,
                            params: {
                                schema : meta.params.toJSON(),
                                name: action.getParamsName()
                            },
                            result:  {
                                schema: meta.result.toJSON(),
                                name: action.getResultName()
                            }
                        });


                    }



                }



                namespaceResult.push({
                    name: namespace.getName(),
                    middleware: namespace.getMiddleware().map((item) =>{
                        let res = item.getMetaData();
                        res.params = {
                            schema: res.params.toJSON(),
                            name: item.getParamsName()
                        };
                        return res;
                    }),
                    actions: actions,
                })

            }


            let result = {
                version: packageJson.version,
                connectors: main.getConnectors().map((item) => { return item.getMeta() }),
                applicationConfig: packageJson.floodConfig,
                namespaces: namespaceResult,
            };

            if(writeToFile == true){
                fs.writeFileSync(path.join(process.cwd(),"./config.json"),JSON.stringify(result));
            }

            return JSON.stringify(result);
        }
    }
}