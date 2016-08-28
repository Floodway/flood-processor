import {  Floodway, WebConnector, WebSocketConnector, Namespace, Action, WebAction, HttpMethod ,ObjectSchema, FileSchema } from "../__entry";
import {SchemaMode, Schema, Str} from "flood-gate";
import {BodyMode} from "../framework/BodyMode";
import {Middleware} from "../framework/Middleware";

let flood = new Floodway();


let webConnector = new WebConnector({
    port: 4040,
});

flood.registerConnector(webConnector);
flood.registerConnector(new WebSocketConnector({
    server: webConnector.getServer(),
    allowedOrigins: ["*"]
}));






@Schema({ mode: SchemaMode.LOOSE })
class TestParams{

    @Str({ groups: ["exposed"] })
    @Str({ groups: ["middleware"], toUpperCase: true })
    name: string;
}

@Schema({ mode: SchemaMode.LOOSE })
class TestResult{

    @Str()
    name: string;
}


class TestMiddleware extends Middleware<TestParams>{

    getName(){ return "testMiddleware" }
    getDescription(){ return "" }
    getParamsClass(){  return TestParams }
    getGroup(){ return "middleware" }

    run(){
        this.next()
    }

}


class TestAction extends Action<TestParams,TestResult> implements WebAction{

    getUrl(){ return "/test" }
    getHttpMethods(){ return [HttpMethod.GET] }
    getBodyMode(){ return BodyMode.JSON }
    useNamespaceRouter(){ return true }

    getParamsClass(){ return  TestParams }
    getGroup(){ return "exposed" }
    getMiddleware(){ return [new TestMiddleware()] }
    getResultClass(){ return  TestResult }

    getName() { return "testAction" }
    getDescription(){ return "Does something!" }

    run(){

        let result = new TestResult();

        result.name = this.getParams().name;

        this.res(result);

    }

}

class Test extends Namespace{


    constructor(){
        super();
        this.action(TestAction);
    }

    getName(){
        return "test";
    }
}

flood.registerNamespace(new Test());

module.exports = flood;