import { Type } from "./Type";
export declare class ArraySchema extends Type {
    private modeS;
    private childrenT;
    private childrenLT;
    hasChildren(): boolean;
    toJSON(): {
        type: string;
        mode: String;
        children: any;
    };
    getMode(): String;
    getChildSchema(): Type;
    child(child: Type): this;
    children(child: Type[]): this;
    build(path?: String): ArraySchema;
    validate(input: any[], callback: {
        (err: any, res: string): void;
    }): void;
}
export declare enum ArrayMode {
    Index = 0,
    Uniform = 1,
}
