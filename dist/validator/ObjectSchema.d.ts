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
    constructor();
    modeToString(mode: ObjectMode): string;
    toJSON(): any;
    hasChildren(): boolean;
    children(children: {
        [path: string]: Type;
    }): this;
    getChild(name: string): Type;
    getChildren(): {
        [path: string]: Type;
    };
    build(path: string): this;
    setClassName(className: string): this;
    getClassName(): string;
    mode(mode: ObjectMode): this;
    validate(item: any, callback: {
        (err: Object, res: Object): void;
    }): void;
}
