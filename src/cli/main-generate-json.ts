#!/usr/bin/env node
import * as program from "commander";
import *  as fs from "fs";
import *  as path from "path";
import findMain from "./findMain";
import generateJSON from "./generate-json";
program
    .option("-s","--save","Save to file")
    .parse(process.argv);

let { main, packageJson } = findMain();

console.log(generateJSON(main,packageJson,true));