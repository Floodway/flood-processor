import *  as uuid from "node-uuid";

export class Utils{


    public static generateUUID(){

        return uuid.v4().toString();

    }

}