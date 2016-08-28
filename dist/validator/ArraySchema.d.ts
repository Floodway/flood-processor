import { Type } from "./Type";
export declare class ArraySchema extends Type {
    private modeS;
    private childrenT;
    private childrenLT;
    hasChildren(): boolean;
    static isArraySchema(input: Type): input is ArraySchema;
    toJSON(): {
        type: string;
        mode: String;
        children: any;
    };
    getMode(): String;
    getChildSchema(): Type;
    child(child: Type): this;
    children(child: Type[]): this;
    validate(input: any[], callback: {
        (err: any, res: string): void;
    }, path?: string): void;
}
export declare enum ArrayMode {
    Index = 0,
    Uniform = 1,
}
