import { Action, WebAction } from "floodway";
export default class TestAction extends Action implements WebAction {
    getWebConfig(): {
        url: string;
        methods: any[];
    };
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
