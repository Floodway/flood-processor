#!/usr/bin/env node
import * as program from "commander";
import * as inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";

program
    .parse(process.argv);

console.log(chalk.blue("Generating a new namespace"));


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

function makeClassName(input:string){
    return input.charAt(0).toUpperCase()+input.slice(1);
}

let rootDir = path.join(findRoot(),"src");

if(!fs.existsSync(path.join(rootDir,"namespaces"))){
    console.error(chalk.red("Could not find namespaces folder."));
    process.exit(0);
}

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

let namespaces = getDirectories(path.join(rootDir,"namespaces"));

function isString(input: any): input is string{
    return input.substr !== undefined;
}

inquirer.prompt({
    type: "input",
    name: "namespaceName",
    message: "Enter name:",
    validate: (value): boolean | string => {
        if(namespaces.indexOf(makeClassName(value)) == -1){
            return true;
        }else{
            return "Namespace already exists.";
        }
    }
}).then((answers) => {
    let namespaceName  = answers['namespaceName'];
    if(isString(namespaceName)){
        let newDir = path.join(rootDir,"namespaces",namespaceName);
        fs.mkdirSync(newDir);
        fs.mkdirSync(path.join(newDir,"actions"));
        fs.mkdirSync(path.join(newDir,"middleware"));

        let file =`
import { Namespace } from "floodway";

export default class ${makeClassName(namespaceName)} extends Namespace{
    
    constructor(){
        super();
        //Add actions here. Keep the INSERT comment to allow automatic adding using flood generate-action
        //INSERT
    }
    getName(){
        return "${namespaceName}";
    }
}
`;
        fs.writeFileSync(path.join(newDir,"namespace.ts"),file);


        let index= fs.readFileSync(path.join(rootDir,"./index.ts")).toString();


        index = index.replace("//INSERT",`flood.registerNamespace(${makeClassName(namespaceName)}); \n //INSERT`);

        let split = index.split("\n");

        split.unshift(`import ${makeClassName(namespaceName)} from "./namespaces/${namespaceName}/namespace";`);



        fs.writeFileSync(path.join(rootDir,"./index.ts"),split.join("\n"));

    }

});