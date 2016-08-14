import {Action,StringSchema,ObjectSchema,Middleware,WebAction, WebConfig,FileCallback} from "../__entry";
import {Utils} from "../utils/utils";


export abstract class UploadAction extends Action implements WebAction{



    abstract getWebConfig(): WebConfig;
    abstract getName(): string;
    abstract getCallbackInfo(): FileCallback;

    getParams(){
        return new ObjectSchema().children({})
    }
    getResult(){
        return new ObjectSchema().children({
            uploadToken: new StringSchema()
        });
    }

    getMiddleware(): Middleware[]{
        return []
    }

    getMetaData(){
        return {
            params: this.getParams(),
            result: this.getResult(),
            supportsUpdates: false,
            name: this.getName(),
            description: "Obtain a token to upload a file",
            middleware: this.getMiddleware(),
            errors: []
        }
    }




    run(){
        let callBackInfo: FileCallback = this.getCallbackInfo();
        let uploadToken = Utils.generateUUID();



        this.redis.hmset("fileUpload:"+uploadToken,{
            action: callBackInfo.action,
            namespace: callBackInfo.namespace,
            params: JSON.stringify(callBackInfo.params)
        },(err,res) => {

            if(err){
                this.fail("internalError",err)
            }else{


                this.res({
                    uploadToken
                })
            }

        })
    }




}