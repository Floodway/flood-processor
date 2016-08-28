"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SchemaStore_1 = require("../framework/SchemaStore");
var SchemaStringAnnotation_1 = require("../framework/SchemaStringAnnotation");
var SchemaStore_2 = require("../framework/SchemaStore");
var Test = (function () {
    function Test() {
    }
    __decorate([
        SchemaStringAnnotation_1.Str({ length: 3 })
    ], Test.prototype, "name", void 0);
    Test = __decorate([
        SchemaStore_1.Schema({ mode: SchemaStore_1.SchemaMode.STRICT })
    ], Test);
    return Test;
}());
var test = new Test();
test.name = "fooo";
SchemaStore_2.schemaStore.validate(test, function (err, item) {
    console.log(err, item);
});
/*

let flood = new Floodway();


let webConnector = new WebConnector({
    port: 4040,
});

flood.registerConnector(webConnector);
flood.registerConnector(new WebSocketConnector({
    server: webConnector.getServer(),
    allowedOrigins: ["*"]
}));



class TestParams{

    name: string;
}

class TestResult{
    @MinLength(4)
    name: string;
}


class TestAction extends Action<TestParams,TestResult> implements WebAction{

    getUrl(){ return "/test" }
    getHttpMethods(){ return [HttpMethod.GET] }
    getBodyMode(){ return BodyMode.JSON }
    useNamespaceRouter(){ return true }

    getParamsInstance(){ return  new TestParams() }

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

module.exports = flood;*/ 
