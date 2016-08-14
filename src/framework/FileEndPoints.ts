import {WebConnector} from "./WebConnector";
import {Floodway} from "./Floodway";
import {Utils} from "../utils/utils";
import * as fs from "fs";
import * as path from "path";
import {UploadRedisSchema} from "./UploadRedisSchema";
import {DownloadRedisSchema} from "./DownloadRedisSchema";
import * as multer from "multer";

let upload = multer({ dest : path.join(process.cwd(),"./uploads")});
export class FileEndPoints{

    private connector: WebConnector;
    private floodway: Floodway;

    register(connector: WebConnector){
        this.connector = connector;
        this.floodway = connector.getFloodway();

        this.connector.getApp().post("/upload/:fileToken",upload.single("file"),this.onUpload.bind(this));
        this.connector.getApp().get("/file/:fileToken",this.onDownload.bind(this));

    }

    fail(res,errorCode,description){
        res.json({
            messageType: "error",
            requestId: Utils.generateUUID(),
            params: {
                errorCode,
                description
            }
        })
    }

    onUpload(req,res){
        if(req.file == null) {
            return this.fail(res, "missingFile", "No file was uploaded");
        }
        this.floodway.getRedis().hgetall("fileUpload:"+req.params.fileToken,(err,fileInfo: UploadRedisSchema) => {
            if(err != null || fileInfo == null){
                try{
                    fs.unlinkSync(req.file.path);
                }catch(e){
                    console.error("Could not unlink file",e)
                }
                return this.fail(res,"invalidToken","Could not upload file. Token was invalid");
            }


            this.floodway.getRedis().del("fileUpload:"+req.params.fileToken,(err,delInfo) => {
                if(err != null){ return this.fail(res,"internalError","Something went wrong.") }

                // Process request that was defined
                let namespace = this.floodway.getNamespace(fileInfo.namespace);
                if(namespace == null) {
                    return this.fail(res, "unknownNamespace", "The namespace was not found.");
                }



                if(namespace.hasAction(fileInfo.action)){
                    req.params = JSON.parse(fileInfo.params);
                    req.params.file = req.file;
                    this.connector.handleRequest(namespace,namespace.getAction(fileInfo.action),req,res);
                }else{
                    return this.fail(res,"unknownAction","The action was not found.");
                }

            })

        })

    }

    performDownload(req,res,downloadInfo: DownloadRedisSchema){

        let namespace = this.floodway.getNamespace(downloadInfo.namespace);
        if(namespace == null){ return this.fail(res,"unknownNamespace","The namespace was not found"); }
        if(namespace.hasAction(downloadInfo.action)){

            req.body = JSON.parse(downloadInfo.params);
            res.json = (data) => {
                // Ignore the result when something is returned
                return null;
            };
            this.connector.handleRequest(namespace,namespace.getAction(downloadInfo.action),req,res);
            try{
                res.sendFile(downloadInfo.path);
            }catch(e){
                console.error("Could not send file: "+downloadInfo.path+" does not exist");
            }


        }else{
            this.fail(res,"unknownAction","The action provided was not found");
        }


    }


    onDownload(req,res){

        this.floodway.getRedis().hgetall("fileDownload:"+req.params.fileToken,(err: any,downloadInfo: DownloadRedisSchema) => {

            if(err != null || downloadInfo == null){
                return this.fail(res,"invalidToken","Could not download file");
            }



            if(downloadInfo.deleteAfterDownload){
                this.floodway.getRedis().del("fileDownload:"+req.params.fileToken,(err: any,delRes) => {
                    if(err != null){ return this.fail(res,"internalError","Something went wrong."); }
                    this.performDownload(req,res,downloadInfo);
                });
            }else{
                this.performDownload(req,res,downloadInfo);
            }

        });

    }


}