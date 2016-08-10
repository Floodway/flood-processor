export declare abstract class Type {
    path: string;
    private isBuiltB;
    abstract hasChildren(): boolean;
    constructor();
    isBuilt(): boolean;
    abstract validate(item: any, callback: {
        (err: Object, res: Object): void;
    }): any;
    build(path?: string): Type;
    abstract toJSON(): any;
    getDefault(): any;
}
