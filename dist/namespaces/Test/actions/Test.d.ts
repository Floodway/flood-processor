import { Action } from "floodway";
export default class Test extends Action {
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
