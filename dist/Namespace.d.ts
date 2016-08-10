import { IAction } from "./Action";
import { Floodway } from "./Floodway";
import { Middleware } from "./Middleware";
export declare abstract class Namespace {
    actions: {
        [path: string]: IAction;
    };
    getMiddleware(): Middleware[];
    constructor();
    start(instance: Floodway): void;
    getActions(): {
        [path: string]: IAction;
    };
    getAction(name: string): IAction;
    hasAction(name: string): boolean;
    action(action: IAction): void;
    abstract getName(): string;
}
