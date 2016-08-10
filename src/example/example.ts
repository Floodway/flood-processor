import {  Floodway, WebConnector, WebSocketConnector, Namespace, Action, WebAction, HttpMethod ,ObjectSchema } from "../__entry";


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
            params: new ObjectSchema().children({}).build("NoParams"),
            result: new ObjectSchema().children({}).build("NoParams"),
            errors: [],
            middleware: [],
            name: "test",
            supportsUpdates: false,
            description: "Test action"
        }
    }
    run(){
        this.res({})
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