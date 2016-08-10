import { IAction, Middleware, Floodway } from "../__entry";


export abstract class Namespace{

    // stores all actions of this namespace
    public actions: { [path:string]:IAction };

    getMiddleware(): Middleware[]{
        return [];
    }

    constructor(){
        this.actions = {};
    }

    // Method gets called when floodway is starting
    // can be used for chron-jobs or setup
    start(instance: Floodway){

    }


    // Provide floodway with the actions this namespace integrates
    getActions(): { [path:string]:IAction } { return this.actions}

    // Get an action by name
    getAction(name: string): IAction { return this.actions[name]; }

    // Check if an action with the defined name exists
    hasAction(name: string){ return this.actions[name] != null; }

    // register a new action in this namespace
    action(action: IAction){

        let temp = new action();

        this.actions[temp.getMetaData().name] = action;
    }

    // get the name of this namespace
    abstract getName(): string;
}
