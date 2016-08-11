import {  Floodway, WebConnector, WebSocketConnector, Namespace, Action, WebAction, HttpMethod ,ObjectSchema } from "../__entry";
import {StringSchema} from "../validator/StringSchema";
import {NumberSchema} from "../validator/NumberSchema";
import {ArraySchema} from "../validator/ArraySchema";


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



class TestAction extends Action implements WebAction{

    getWebConfig(){
        return {
            url: "/",
            methods: [HttpMethod.GET]
        }
    }

    getMetaData(){
        return {
            params: new ObjectSchema().children({}).build("Foo.NoParams").setClassName("Foo.NoParams"),
            result: new ObjectSchema().children({
                time: new NumberSchema()
            }).build("TestResult"),
            errors: [],
            middleware: [],
            name: "test",
            supportsUpdates: false,
            description: "Test action"
        }
    }
    run(){
        this.res({
            time: Date.now()
        })
    }
}

class ExampleNamespace extends Namespace{

    getName(){
        return "test"
    }

    constructor(){
        super();
        this.action(TestAction);
    }

}

flood.registerNamespace(new ExampleNamespace());


module.exports = flood;