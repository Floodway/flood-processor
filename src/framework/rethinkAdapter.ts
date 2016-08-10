import {Namespace} from "./Namespace";
import {WebAction, HttpMethod} from "./WebConnector";
import {Action} from "./Action";
import * as r from "rethinkdb";
import {ObjectSchema, ObjectMode} from "./validator/ObjectSchema";
import {StringSchema} from "./validator/StringSchema";
import {Type} from "./validator/Type";
import {Middleware} from "./Middleware";
import {ArraySchema, ArraySchemaMode} from "./validator/ArraySchema";

export abstract class RestBase extends Action{


    abstract getItemName():string;

    abstract getSchema(): ObjectSchema;

    abstract getDb(callback:{ (db:r.Connection) })

    getMiddleware(): Middleware[]{
        return []
    }

    getItemNamePlural():string {
        return this.getItemName() + "s"
    }

    getTable():string {
        return this.getItemNamePlural();
    }

    getPath():string {
        return "/" + this.getItemName();
    }

}

export abstract class Create extends RestBase implements WebAction{
    getMetaData(){
        return {
            name: "create",
            description: "Creates a new item in the database",
            errors: [],
            supportsUpdates: false,
            middleware: this.getMiddleware(),
            params: this.getSchema(),
            result: new ObjectSchema().children({
                id: new StringSchema().length(36)
            }),
        }
    }
    run(){
        this.getDb((db: r.Connection) => {
            r.table(this.getTable()).insert(this.params).run(db,(err,res) => {
                if(err != null){ return this.fail("internalError",err) }
                this.res({
                    id: res.generated_keys[0]
                });
            });
        });
    }
    getWebConfig(){
        return {
            url: this.getPath(),
            methods: [HttpMethod.POST]
        }
    }
}

export abstract class Update extends RestBase implements WebAction{

    getMetaData(){
        return {
            name: "update",
            description: "Update an item in the database",
            errors: [],
            supportsUpdates: false,
            middleware: this.getMiddleware(),
            params: new ObjectSchema().children({
                item: this.getSchema().mode(ObjectMode.PARTIAL),
                id: new StringSchema().length(36)
            }),
            result: new ObjectSchema().children({}),
        }
    }

    getWebConfig(){
        return {
            url: this.getPath()+"/:id",
            methods: [HttpMethod.PATCH]
        }
    }

    run(){

        this.getDb((db: r.Connection) => {
            r.table(this.getTable()).filter({ id: this.params.id }).update(this.params.item).run(db,(err,res) => {
                if(err != null){ return this.fail("internalError",err) }
                this.res({
                    updated: res.replaced
                });
            })
        })

    }

}

export abstract class Get extends RestBase implements WebAction{


    abstract getOutputSchema(): ObjectSchema;


    getSchema(){
        return null;
    }

    getFilter(){
        return {id: this.params.id};
    }


    getMetaData(){
        return {
            name: "get",
            description: "Get an item from the database",
            errors: [{ errorCode: "notFound", description: "The item specified was not found" }],
            supportsUpdates: false,
            middleware: this.getMiddleware(),

            params: new ObjectSchema().children({
                id: new StringSchema().length(36)
            }),
            result: this.getOutputSchema().mode(ObjectMode.SHORTEN),
        }
    }


    getWebConfig(){
        return {
            url: this.getPath()+"/:id",
            methods: [HttpMethod.GET]
        }
    }

    run(){

        this.getDb((db) => {
            r.table(this.getTable()).filter(this.getFilter()).run(db,(err,cursor) => {
                if(err != null){ return this.fail("internalError",err) }
                cursor.toArray((err,items) => {
                    if(err != null){ return this.fail("internalError",err) }

                    if(items.length != 1){ return this.fail("notFound") }

                    this.res(items[0]);
                })

            })
        });

    }
}

export abstract class StreamAll extends RestBase{

    abstract getOutputSchema(): ObjectSchema;

    getFilter(): any{
        return {};
    }

    getSchema(){
        return null;
    }


    getMetaData(){
        return {
            name: "streamAll",
            description: "Get all items from the database",
            errors: [],
            supportsUpdates: true,
            middleware: this.getMiddleware(),
            params: new ObjectSchema().children({}),
            result: new ObjectSchema().mode(ObjectMode.PARTIAL).children({
                type: new StringSchema().oneOf(["value","removed"]),
                id: new StringSchema().length(36),
                value: this.getOutputSchema()
            }),
        }
    }

    run(){


        this.getDb((db: r.Connection) => {
            r.table(this.getTable()).changes({ includeInitial: true }).filter(this.getFilter).run(db,(err,cursor) => {
                if(err != null){ return this.fail("internalError",err) }


                cursor.each((err, ev) => {
                    if(err != null){ return this.fail("internalError",err) }
                    console.log("Event",ev);
                    if(ev.new_val != null){
                        this.res({
                            type: "value",
                            id: ev.new_val.id,
                            value: ev.new_val
                        })
                    }else{
                        this.res({
                            type: "removed",
                            id: ev.old_val.id,
                        })
                    }
                });

                this.once("done",() => {
                    console.log("Closing...");
                    cursor.close();
                })
            });
        });
    }
}


export abstract class GetAll extends RestBase implements WebAction{

    abstract getOutputSchema(): ObjectSchema;

    getFilter(): any{
        return {};
    }

    getSchema(){
        return null;
    }

    getWebConfig(){
        return {
            url: this.getPath()+"/",
            methods: [HttpMethod.GET]
        }
    }

    getMetaData(){
        return {
            name: "getAll"+this.getItemNamePlural(),
            description: "Get all items from the database",
            errors: [],
            supportsUpdates: false,
            middleware: this.getMiddleware(),
            params: new ObjectSchema().children({}),
            result: new ArraySchema().child(this.getOutputSchema().mode(ObjectMode.PARTIAL)),
        }
    }

    run(){
        this.getDb((db: r.Connection) => {
           r.table(this.getTable()).filter(this.getFilter).run(db,(err,cursor) => {
                if(err != null){ return this.fail("internalError",err) }
                cursor.toArray((err,items) => {
                    if(err != null){ return this.fail("internalError",err) }
                    this.res(items);
                });
           });
        });
    }
}