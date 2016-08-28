#!/usr/bin/env node
import *  as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import *  as Utils from "./utils";

import {BodyMode, HttpMethod, WebAction, Action} from "../__entry";


function findRoot(){
    let currentPath = process.cwd();
    while(true){
        if(fs.existsSync(path.join(currentPath,"./package.json"))){
            return currentPath;
        }else{
            currentPath = path.join(currentPath,"../");
        }
    }
};


let rootDir = findRoot();

console.log(chalk.red("Generating the documentation only works if the Project follows the Flood design specs!"));

// Load main file to retrieve information about connectors


let main = require(require(path.join(rootDir,"./package.json")["main"]));

let result;

if(main != null){

    result = {
        version: packageJson.version,
        connectors: main.getConnectors().map((item) => { return item.getMeta() }),
    };

    // Scan for namespaces

    let namespaces = Utils.getDirectories(path.join(rootDir,"./src/namespaces"));

    console.log(chalk.green(`Found ${namespaces.length} namespaces!`));

    for(let namespaceDir of namespaces){



    }


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
                    let action: Action<any,any> = new actionI();

                    action.setNamespace(namespace);
                    actions.push(action.toJson());

                    console.log(action.toJson().params);

                }



                namespaceResult.push({
                    name: namespace.getName(),
                    actions: actions,
                })

            }


            let result = {

                namespaces: namespaceResult,
            };

            if(writeToFile == true){
                fs.writeFileSync(path.join(process.cwd(),"./config.json"),JSON.stringify(result));
            }

            return JSON.stringify(result);
        }
    }
}