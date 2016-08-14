#!/usr/bin/env node
import * as program from "commander";
import * as inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";

program
    .parse(process.argv);

console.log(chalk.blue("Generating a new action"));

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

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

if(!fs.existsSync(path.join(rootDir,"./src/namespaces/"))){
    console.error(chalk.red("Can not generate a namespace. Project doesn\'t follow folder structure"));
    process.exit(1);
}

let namespacesPath = path.join(rootDir,"./src/namespaces/");
let availableNamespaces = getDirectories(namespacesPath);

if(availableNamespaces.length == 0){
    console.error("No namespaces in this project yet. Run flood generate-namespace to create one");
    process.exit(1);
}


function getMeta(namespaceName: string){

    return inquirer.prompt([{
        type: "input",
        name: "actionName",
        message: "What should the action be called",
        validate: (value): string | boolean => {
            var re = new RegExp("([a-z]+[A-Z]+[a-z]+)+|[a-z]+");
            if(re.test(value)){
                let actionPath = path.join(namespaceDir,"./actions",value+".js");
                if(fs.existsSync(actionPath)){
                    return chalk.red("This action already exists");
                }else{

                    if(value.toLowerCase() != namespaceName.toLocaleLowerCase()){
                        return true;
                    }
                    return chalk.red("Can not create an action with the same name as the namespace.");

                }

            }else{
                return chalk.red("Make sure the action name is camelCased (starting lower-cased!)")
            }
        }
    },{
        type: "input",
        name: "description",
        message: "Enter a description for this action",
        validate: (value): string | boolean => {
            if(value.length < 5){
                return chalk.red("Please enter a sufficient description")
            }else{
                return true;
            }
        }
    },{
        type: "confirm",
        name: "supportsUpdates",
        message: "Does the action support updates?",
    }])

}
function isString(input: any): input is string{
    return input.substr !== undefined;
}

function getNamespace(){

    return inquirer.prompt({
        type: "list",
        name: "namespace",
        message: "Which namespace would you like to use?",
        choices: availableNamespaces
    })

}

function checkRestPoint(){

    return inquirer.prompt({
        type: "confirm",
        name: "createRest",
        message: "Do you want to create a Rest-Endpoint?"
    })

}

function getRestPointInfo(){

    return inquirer.prompt([{
        type: "input",
        name: "url",
        message: "What URL should the endpoint be located at?"
    },{
        type: "checkbox",
        name: "methods",
        message: "Select HTTP Verbs",
        choices: [
            { name: "GET",  value: "HttpMethod.GET" },
            { name: "POST",value: "HttpMethod.POST" },
            { name: "PATCH",  value: "HttpMethod.PATCH" },
            { name: "DELETE",  value: "HttpMethod.DELETE" },
        ]
    }])

}

function makeClassName(input:string){
    return input.charAt(0).toUpperCase()+input.slice(1);
}

function generate(namespace,action,description,supportsUpdates,createRestpoint,url,methods){


    let filePath = path.join(namespacesPath,namespace,"./actions/",action+".ts");
    console.log(filePath);
    let webConfig;

    if(createRestpoint){

        webConfig = `
    getWebConfig(){
        return {
            url: "${url}",
            methods: [${methods.join(",")}]
        }
    }
`;

    }else{
        webConfig = "";
    }

    let file = `// Import dependencies
import { Action, ObjectSchema ${ createRestpoint ? ", WebAction , HttpMethod" : "" } } from "floodway";

export default class ${ makeClassName(action) }Action extends Action ${ createRestpoint ? "implements WebAction" : "" }{
    
${webConfig}
    
    getMetaData(){
        return{
            name: "${action}",
            description: "${description}",
            supportsUpdates: ${supportsUpdates},
            params: new ObjectSchema().children({
            
            }),
            result: new ObjectSchema().children({
                
            }),
            middleware: [],
            errors: []
        }
    }
    
    run(){
       
    }
    
}
`



    fs.writeFileSync(filePath,file);


    // Automatically add to the namespace

    let namespaceTs = fs.readFileSync(path.join(namespaceDir,"namespace.ts")).toString();

    if(namespaceTs.indexOf("//INSERT") != -1){

        namespaceTs = namespaceTs.replace("//INSERT",`this.action(${makeClassName(action)}Action);
        //INSERT
`);

        let splits = namespaceTs.split("\n");
        splits.unshift(`import ${makeClassName(action)}Action from "./actions/${makeClassName(action)}";`);

        fs.writeFileSync(path.join(namespaceDir,"namespace.ts"),splits.join("\n"));

    }else{
        console.log(chalk.red("Could not automatically add action to namespace. Missing //INSERT comment!"));
    }


}



let namespaceDir;
getNamespace()
    .then((nsInfo) => {
        let { namespace } = nsInfo;
        if(isString(namespace)){
            namespaceDir = path.join(namespacesPath,namespace);

            getMeta(namespace).then((meta) => {
                let { actionName, description, supportsUpdates } = meta;

                if(!supportsUpdates){

                    checkRestPoint().then((checkRestResult) => {

                        if(checkRestResult["createRest"]){

                            getRestPointInfo().then((restPointInfo) => {
                                let { url, methods } = restPointInfo;
                                generate(namespace,actionName,description,supportsUpdates,true,url,methods);
                            })

                        }else{
                            generate(namespace,actionName,description,supportsUpdates,false,null,null);
                        }
                    })
                }else{
                    generate(namespace,actionName,description,supportsUpdates,false,null,null);
                }
            })
        }

    });

