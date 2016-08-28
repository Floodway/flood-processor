#!/usr/bin/env node
import * as program from "commander";
import * as inquirer from "inquirer";
import *  as fs from "fs";
import *  as chalk from "chalk";
import *  as path from "path";
import {Floodway, Type, ObjectSchema, ArraySchema, Namespace, IAction} from "../__entry";
import findMain from "./findMain";
import _ = require("lodash");

// Init
program.parse(process.argv);

let files, main: Floodway, outDir, javaPackage;

files = findMain();
main = files.main;


// Determine out directory
if(files.packageJson.javaOut == null){
    outDir = path.join(process.cwd(),"./java");
}else{
    outDir = files.packageJson.javaOut;
}

if(!fs.existsSync(outDir)){ fs.mkdirSync(outDir);}

// Determine Java package
if(files.packageJson.javaPackage != null){
    javaPackage = "package "+files.packageJson.javaPackage+";";
}else{
    javaPackage = "";
}


function getType(schema: Type){

    if(ObjectSchema.isObjectSchema(schema)){
        return schema.getClassName();
    }else{

        let json = schema.toJSON();

        switch(json.type){
            case "number":
                return json.allowsDecimals ? "float" : "long";
            case "string":
                return "String";
            case "array":
                if(ArraySchema.isArraySchema(schema)){
                    return "List<"+getType(schema.getChildSchema())+">";
                }
                break;
            case "boolean":
                return "boolean";
        }
    }
}

function generateSchemas(namespace: Namespace,generateImmutables){

    let result = "";
    let generatedObjects : { [path:string]:string } = {};

    Object.keys(namespace.actions).map((actionName) => {
        let actionI: IAction = namespace.actions[actionName];
        let action = new actionI();

        function convertSchema(schemaI: Type){
            let setters  = 0;
            let result = "";
            if(ObjectSchema.isObjectSchema(schemaI)){

                if(schemaI.getClassName().indexOf(".") == -1 && !generatedObjects.hasOwnProperty(schemaI.getClassName())){
                    if(!generateImmutables){

                        result += "    public static class "+schemaI.getClassName()+"{";
                        Object.keys(schemaI.getChildren()).map((key) => {
                            let childSchema = schemaI.getChild(key);
                            if(ObjectSchema.isObjectSchema(childSchema)){
                                convertSchema(childSchema);
                            }
                            if(ArraySchema.isArraySchema(childSchema)){
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

                    }else{

                        result +=  "    @Value.Immutable public static abstract class "+schemaI.getClassName()+"{";

                        Object.keys(schemaI.getChildren()).map((key) => {
                            let childSchema = schemaI.getChild(key);
                            if(isObjectSchema(childSchema)){
                                convertSchema(childSchema);
                            }
                            if(isArraySchema(childSchema)){
                                convertSchema(childSchema.getChildSchema());
                            }
                            result += "public abstract "+getType(childSchema)+" "+key+"();";
                        });
                        result += "}";

                    }


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


        result += convertTemplate(fs.readFileSync(path.join(__dirname,"../../templates/javaClass.template")).toString(),{
            "action": name,
            "namespace": namespace.getName(),
            "className": makeClassName(name),
            "paramsClass": paramsClass,
            "resultClass": resultClass,
        });



    });

    return result;

}

function convertTemplate(template,vars){



    for(let key of Object.keys(vars)){
        let re = new RegExp("\\${"+key+"}","g");
        template = template.replace(re,vars[key]);
    }
    return template;
}





let allFiles = ["Api.java","ApiActivity.java","ApiFragment.java","Request.java","ApiStatusCallback.java","SsidProvider.java","BaseUrlProvider.java","Utils.java"];

let copyFiles = [];

if(files.packageJson["copyFiles"] != null){

}

inquirer.prompt([{
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
}]).then((answer) => {

    generateFiles(answer["namespaces"],answer["generateImmutables"]);



    files.map((file) => {
        fs.readFile(path.join(__dirname,"../../templates",file),(err,data) => {
            let split = data.toString().split("\n");
            split.unshift(javaPackage);
            fs.writeFile(path.join(outDir,file),split.join("\n"),(err) => {
                console.log(err);
                console.log("Copied file: "+file)
            })
        });
    });



});


function generateFiles(namespaces,generateImmutables){

    namespaces.map((name) => {
        let namespace = main.getNamespace(name);

        let schemas = generateSchemas(namespace,generateImmutables);
        let functions = generateFunctions(namespace);

        let imports = generateImmutables ? "import org.immutables.value.Value;" : "";

        let file = `
${javaPackage}
import java.util.List;
${imports}
/*
* This class was automatically generated by Floodway.
*/
${ generateImmutables ? "@Value.Enclosing" : "" }
public class ${makeClassName(namespace.getName())}{
    ${schemas}
    
    ${functions}
}
    `;

        fs.writeFileSync(path.join(outDir,makeClassName(namespace.getName())+".java"),file);

    });




}


