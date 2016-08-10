#!/usr/bin/env node
import * as express from "express";
import * as program from "commander";
import *  as path from "path";
import {exec} from "child_process";

program
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



setInterval(() => {
     exec("node "+process.argv[1].split("main-serve-json")[0]+"main-generate-json.js", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        //console.log(`stdout: ${stdout}`);
        //console.log(`stderr: ${stderr}`);
    });




},1500);

let app = express();

app.get("/config.json",(req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.json(require(path.join(process.cwd(),"./config.json")))
});

app.listen(5763);