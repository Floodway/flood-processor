import { Type } from "./Type";
export declare class BooleanSchema extends Type {
    private inverseB;
    toJSON(): {
        type: string;
    };
    validate(data: any, callback: {
        (err: any, res: boolean): void;
    }, path?: string): void;
    hasChildren(): boolean;
    inverse(value?: boolean): BooleanSchema;
}
