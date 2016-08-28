import { IAction, Middleware, Floodway } from "../__entry";
export declare abstract class Namespace {
    actions: {
        [path: string]: IAction;
    };
    getMiddleware(): Middleware<any>[];
    constructor();
    start(instance: Floodway): void;
    getRootUrl(): string;
    getActions(): {
        [path: string]: IAction;
    };
    getAction(name: string): IAction;
    hasAction(name: string): boolean;
    action(action: IAction): void;
    abstract getName(): string;
}
