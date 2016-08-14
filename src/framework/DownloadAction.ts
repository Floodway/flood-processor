import {WebAction,Action,ObjectSchema,StringSchema,Type,Utils,FileCallback,Middleware,WebConfig} from "../__entry";
export abstract class DownloadAction extends Action implements WebAction{


    abstract getWebConfig(): WebConfig;
    abstract getName(): string;

    getMetaData(){
        return {
            name: this.getName(),
            supportsUpdates: false,
            description: "Obtain a download token for a file",
            params: this.getParams(),
            result: this.getResult(),
            middleware: this.getMiddleware(),
            errors: this.getErrors()
        }
    }

    getMiddleware(): Middleware[]{
        return [];
    }

    getErrors(){
        return []
    }

    abstract getFilePath(callback: {(err:any,path:string)});
    abstract getParams(): Type;


    getResult(){
        return new ObjectSchema().children({
            downloadToken: new StringSchema()
        })
    }

    getExpireTime(): Number{
        return null;
    }

    abstract getCallbackInfo(): FileCallback;

    run(){

        let deleteAfterDownload = this.getExpireTime == null;

        let downloadToken  = Utils.generateUUID();



        this.getFilePath((err:any,path: string) => {
            console.log(path);
            if(err != null){
                this.fail("internalError",err);
            }else{
                this.redis.hmset("fileDownload:"+downloadToken,{
                    namespace: this.getCallbackInfo().namespace,
                    action: this.getCallbackInfo().action,
                    deleteAfterDownload,
                    params: JSON.stringify(this.getCallbackInfo().params),
                    path: path
                },(err,res) => {
                    if(err != null){ return this.fail("internalError",err) }
                    this.res({
                        downloadToken
                    })
                });
            }

        });




    }



}