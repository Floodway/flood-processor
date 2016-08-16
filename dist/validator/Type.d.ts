export declare abstract class Type {
    abstract hasChildren(): boolean;
    constructor();
    abstract validate(item: any, callback: {
        (err: Object, res: Object): void;
    }, path: string): any;
    abstract toJSON(): any;
    getDefault(): any;
}
