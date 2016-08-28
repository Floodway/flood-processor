import * as fs from "fs";
import * as path from "path";
import {HttpMethod} from "../framework/HttpMethod";
function makeClassName(input: string){
    return input.charAt(0).toUpperCase()+input.slice(1);
}

export function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

export function httpMethodToString(method: HttpMethod): string{
    switch(method){
        case HttpMethod.DELETE:
            return "DELETE";
        case HttpMethod.GET:
            return "GET";
        case HttpMethod.PATCH:
            return "PATCH";
        case HttpMethod.POST:
            return "POST";
        case HttpMethod.HEAD:
            return "HEAD";
        default:
            return "UNKNOWN";
    }
}