import { Type } from "./Type";
export declare enum ObjectMode {
    STRICT = 0,
    LOOSE = 1,
    SHORTEN = 2,
    PARTIAL = 3,
}
export declare class ObjectSchema extends Type {
    private childrenT;
    private className;
    private modeS;
    constructor(className: string);
    makeClassName(input: string): string;
    modeToString(mode: ObjectMode): string;
    static isObjectSchema(input: any): input is ObjectSchema;
    toJSON(): any;
    hasChildren(): boolean;
    children(children: {
        [path: string]: Type;
    }): this;
    getChild(name: string): Type;
    getChildren(): {
        [path: string]: Type;
    };
    getClassName(): string;
    mode(mode: ObjectMode): this;
    validate(item: any, callback: {
        (err: Object, res: Object): void;
    }, path?: string): void;
}
