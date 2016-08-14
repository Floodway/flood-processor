#!/usr/bin/env node
import * as program from "commander";
import *  as fs from "fs";
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

    let result = "";
    let generatedObjects : { [path:string]:string } = {};

    Object.keys(namespace.actions).map((actionName) => {
        let actionI: IAction = namespace.actions[actionName];
        let action = new actionI();

        function convertSchema(schemaI: Type){

            if(isObjectSchema(schemaI)){
                if(schemaI.getClassName() == null){
                    throw new Error("Could not convert schema "+schemaI.path+" to class. Missing name!");
                }
                if(schemaI.getClassName().indexOf(".") == -1 && !generatedObjects.hasOwnProperty(schemaI.getClassName())){
                    let result = "public static class "+schemaI.getClassName()+"{";
                    Object.keys(schemaI.getChildren()).map((key) => {
                        let childSchema = schemaI.getChild(key);
                        if(isObjectSchema(childSchema)){
                            convertSchema(childSchema);
                        }
                        if(isArraySchema(childSchema)){
                            convertSchema(childSchema.getChildSchema());
                        }
                        result += "private "+getType(childSchema)+" "+key+";";
                    });

                    Object.keys(schemaI.getChildren()).map((key) => {
                        let childSchema = schemaI.getChild(key);

                        result += "public void set"+makeClassName(key)+"("+getType(childSchema)+" "+key+"){this."+key+" = "+key+"; }";
                        result += "public "+getType(childSchema)+" get"+makeClassName(key)+"(){ return this."+key+"; }";

                    });

                    result += "}";

                    generatedObjects[schemaI.getClassName()] = result;

                }
            }

        }


        convertSchema(action.getMetaData().params);
        convertSchema(action.getMetaData().result);


    });
    let final = "";
    console.log(generatedObjects);
    Object.keys(generatedObjects).map((key) => {
        final += "\n"+generatedObjects[key];
    });

    console.log(final);

    return final;

}

function generateFunctions(namespace: Namespace){
    let result = "";
    Object.keys(namespace.getActions()).map((actionName) => {



        let actionI: IAction = namespace.getAction(actionName);
        let action = new actionI;


        let name = action.getMetaData().name;
        let resultClass = getType(action.getMetaData().result);
        let paramsClass = getType(action.getMetaData().params);

        result += `
            
            public abstract static class ${makeClassName(name)}Callback{
                abstract void result(${resultClass} result);
                abstract void err(String errorCode,String description);
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

Object.keys(main.getNamespaces()).map((name) => {
    let namespace = main.getNamespace(name);

    let schemas = generateSchemas(namespace);
    let functions = generateFunctions(namespace);

    let file = `
        /*
        * This class was automatically generate by Floodway.
        */
        class ${makeClassName(namespace.getName())}{
            ${schemas}
            ${functions}
        }
    `;

    fs.writeFileSync(path.join(outDir,makeClassName(namespace.getName())+".java"),file);

});



