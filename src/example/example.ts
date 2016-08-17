import {  Floodway, WebConnector, WebSocketConnector, Namespace, Action, WebAction, HttpMethod ,ObjectSchema, FileSchema } from "../__entry";
import {StringSchema} from "../validator/StringSchema";
import {NumberSchema} from "../validator/NumberSchema";
import {ArraySchema} from "../validator/ArraySchema";
import {DownloadAction} from "../framework/DownloadAction";
import {BodyMode} from "../framework/BodyMode";


let flood = new Floodway();

let webConnector = new WebConnector({
    port: 4040,
});

flood.registerConnector(webConnector);
flood.registerConnector(new WebSocketConnector({
    server: webConnector.getServer(),
    allowedOrigins: ["*"],
    port: null
}));



class TestAction extends WebAction{

    getHttpMethods(){
        return [HttpMethod.POST]
    }

    getWebMetaData(){
        return {
            params: new ObjectSchema("TestParams").children({
                items: new ArraySchema().child(new ObjectSchema("TestChild").children({
                    meta: new ObjectSchema("meta").children({
                        foo: new StringSchema(),
                        bar: new StringSchema()
                    }),
                    bar: new StringSchema()
                }))
            }),
            result: new ObjectSchema("TestActionResult").children({
                time: new NumberSchema()
            }),
            errors: [],
            middleware: [],
            name: "test",
            description: "Test action"
        }
    }
    run(){
        this.res({
            time: Date.now()
        })
    }
}


class ExampleDownload extends DownloadAction{


    getName(){
        return "download"
    }

    getParams(){
        return new ObjectSchema("NoParams").children({})
    }

    run(){

        this.res({
            path: "C:\\im.jpg"
        })
    }

}

class ExampleUpload extends WebAction{

    allowUploads(){
        return true;
    }

    getHttpMethods(){
        return [HttpMethod.POST];
    }

    getBodyMode(){
        return BodyMode.UrlEncoded;
    }

    getWebMetaData(){
        return {
            name: "upload",
            description: "Uploads a file",
            result: new ObjectSchema("NoRes").children({}),
            params: new ObjectSchema("ExampleUploadParamsProcessed").children({
                file: FileSchema
            }),
            exposeParams: new ObjectSchema("ExampleUploadParams").children({
                file: new StringSchema()
            }),
            errors: [],
            middleware: []
        }
    }

    run(){
        console.log(this.params);
        this.res({});
    }



}

class ExampleNamespace extends Namespace{

    getName(){
        return "test"
    }

    constructor(){
        super();
        this.action(TestAction);
        this.action(ExampleDownload);
        this.action(ExampleUpload);
    }

}

flood.registerNamespace(new ExampleNamespace());


module.exports = flood;