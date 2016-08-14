import { Action } from "floodway";
export default class FooAction extends Action {
    getMetaData(): {
        name: string;
        description: string;
        supportsUpdates: boolean;
        params: any;
        result: any;
        middleware: any[];
        errors: any[];
    };
    run(): void;
}
