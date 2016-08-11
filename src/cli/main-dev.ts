#!/usr/bin/env node
import * as program from "commander";
import *  as fs from "fs";
import *  as path from "path";
import findMain from "./findMain";

program
    .parse(process.argv);

let main = findMain();

if(main != null){
    main.start();
}