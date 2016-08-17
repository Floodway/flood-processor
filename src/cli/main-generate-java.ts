#!/usr/bin/env node
import * as program from "commander";
import * as inquirer from "inquirer";
import *  as fs from "fs";
import *  as chalk from "chalk";
import *  as path from "path";
import {Floodway,Type,ObjectSchema,NumberSchema,ArraySchema,Action,Namespace,IAction} from "../__entry";
import findMain from "./findMain";


program
    .parse(process.argv);

let files = findMain();

let main: Floodway = files.main;

function isObjectSchema(input: any) : input is ObjectSchema{
    return input.getClassName !== undefined;
}

function isNumberSchema(input: any): input is NumberSchema{
    return input.allowsDecimals !== undefined;
}

function isArraySchema(input: any): input is ArraySchema{
    return input.getChildSchema !== undefined;
}

function makeClassName(input: string){
    return input.charAt(0).toUpperCase()+input.slice(1);
}



let outDir;
if(files.packageJson.javaOut == null){
    outDir = path.join(process.cwd(),"./java");
}else{
    outDir = files.packageJson.javaOut;
}

let javaPackage = "";
if(files.packageJson.javaPackage != null){
    javaPackage = "package "+files.packageJson.javaPackage+";";
}




function getType(schema: Type){
    if(isObjectSchema(schema)){
        return schema.getClassName();
    }else{
        let json = schema.toJSON();

        switch(json.type){
            case "number":

                return json.allowsDecimals ? "float" : "long";

            case "string":

                return "String";

            case "array":

                if(isArraySchema(schema)){

                    return "List<"+getType(schema.getChildSchema())+">";
                }

                break;
            case "boolean":

                    return "boolean";



        }
    }
}

function generateSchemas(namespace: Namespace){

    console.log(chalk.green("→  Generating namespace: "+namespace.getName()));

    let result = "";
    let generatedObjects : { [path:string]:string } = {};

    Object.keys(namespace.actions).map((actionName) => {
        let actionI: IAction = namespace.actions[actionName];
        let action = new actionI();

        function convertSchema(schemaI: Type){
            let setters  = 0;
            if(isObjectSchema(schemaI)){

                if(schemaI.getClassName().indexOf(".") == -1 && !generatedObjects.hasOwnProperty(schemaI.getClassName())){
                    let result = "    public static class "+schemaI.getClassName()+"{";
                    Object.keys(schemaI.getChildren()).map((key) => {
                        let childSchema = schemaI.getChild(key);
                        if(isObjectSchema(childSchema)){
                            convertSchema(childSchema);
                        }
                        if(isArraySchema(childSchema)){
                            convertSchema(childSchema.getChildSchema());
                        }
                        result += "public "+getType(childSchema)+" "+key+";";
                    });

                    Object.keys(schemaI.getChildren()).map((key) => {
                        let childSchema = schemaI.getChild(key);

                        result += "public void set"+makeClassName(key)+"("+getType(childSchema)+" "+key+"){this."+key+" = "+key+"; }";
                        result += "public "+getType(childSchema)+" get"+makeClassName(key)+"(){ return this."+key+"; }";

                        setters++;

                    });

                    result += "}";

                    generatedObjects[schemaI.getClassName()] = result;
                    console.log(chalk.green("\t ✓ Generated Class: "+schemaI.getClassName()));
                    console.log(chalk.green("\t \t ✓ Generated "+setters+" Setters/Getters"))

                }
            }

        }

        if(action.getMetaData().exposeParams != null){
            convertSchema(action.getMetaData().exposeParams);
        }else{
            convertSchema(action.getMetaData().params);
        }
        convertSchema(action.getMetaData().result);


    });
    let final = "";
    Object.keys(generatedObjects).map((key) => {
        final += "\n"+generatedObjects[key];
    });



    return final;

}

function generateFunctions(namespace: Namespace){
    let result = "";
    Object.keys(namespace.getActions()).map((actionName) => {



        let actionI: IAction = namespace.getAction(actionName);
        let action = new actionI;


        let name = action.getMetaData().name;
        let resultClass = getType(action.getMetaData().result);
        let paramsClass;
        if(action.getMetaData().exposeParams != null){
            paramsClass = getType(action.getMetaData().exposeParams);
        }else{
            paramsClass = getType(action.getMetaData().params);
        }

        result += `
    public abstract static class ${makeClassName(name)}Callback{
        public abstract void result(${resultClass} result);
        public abstract void err(String errorCode,String description);
    }
    
    public static Request ${name}(${ paramsClass } params,final ${makeClassName(name)}Callback callback){
        return new Request("${namespace.getName()}","${name}",params,new Request.RequestCallback(${resultClass}.class){
            @Override
            public void res(Object result){
                callback.result((${resultClass}) result);
            }
            @Override
            public void err(String ec,String desc){
                callback.err(ec,desc);
            }
        });
    }
        `;

    });

    return result;

}


if(!fs.existsSync(outDir)){
    fs.mkdirSync(outDir);
}


inquirer.prompt({
    type: "checkbox",
    name: "namespaces",
    message: "Select namespaces",
    choices: Object.keys(main.getNamespaces()).map((key) => {
        return {
            name: key,
            value: key,
            checked: true
        }
    })
}).then((answer) => {
    generateFiles(answer["namespaces"]);
});


function generateFiles(namespaces){

    namespaces.map((name) => {
        let namespace = main.getNamespace(name);

        let schemas = generateSchemas(namespace);
        let functions = generateFunctions(namespace);

        let file = `
${javaPackage}
import java.util.List;
/*
* This class was automatically generated by Floodway.
*/
public class ${makeClassName(namespace.getName())}{
    ${schemas}
    ${functions}
}
    `;

        fs.writeFileSync(path.join(outDir,makeClassName(namespace.getName())+".java"),file);

    });




}


