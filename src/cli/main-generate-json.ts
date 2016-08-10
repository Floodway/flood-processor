#!/usr/bin/env node
import * as program from "commander";
import *  as fs from "fs";
import *  as path from "path";
import generateJSON from "./generate-json";
program
    .option("-s","--save","Save to file")
    .parse(process.argv);


let packageJsonPath  = path.join(process.cwd(),"./package.json");
let packageJson;
try{
    packageJson = require(packageJsonPath);
}catch(e){
    console.error("Could not open package.json file. Make sure you are at root level of your project",e);
    process.exit(1);
}
let sourcePath;
if(packageJson != null){
    sourcePath = path.join(process.cwd(),packageJson.main);
}
let main;
try{
    main = require(sourcePath)
}catch(e){
    console.error("Could not open the main floodway file. Make sure it exsits.",e);
    process.exit(1);
}

console.log(generateJSON(main,packageJson,true));