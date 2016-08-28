export declare class SchemaItem {
    private options;
    private constructor;
    private constraints;
    constructor(options: SchemaOptions, constructor: Function);
    getName(): string;
    addConstraint(path: string, constraint: Constraint): void;
    setOptions(options: SchemaOptions): void;
    getConstraintsForGroup(group: string): {};
    validate<T>(data: any, callback: {
        (err: ValidationError, res: T);
    }, group: any, path: any): any;
}
export interface Constraint {
    validate: {
        (item: any, callback: {
            (err: ValidationError, item: any);
        }, path);
    };
    options: ConstraintOptions;
}
export declare enum SchemaMode {
    LOOSE = 0,
    STRICT = 1,
    SHORTEN = 2,
}
export interface SchemaOptions {
    mode: SchemaMode;
}
export declare function Schema(options: SchemaOptions): (constructor: Function) => void;
export interface ValidationError {
    errorCode: string;
    description: string;
    path: string;
}
export declare class SchemaStore {
    private schemas;
    constructor();
    validate<T>(item: any, callback: {
        (err: ValidationError, result: T);
    }, group?: any, path?: any): void;
    addConstraint(c: any, name: any, constraint: Constraint): void;
    registerSchema(constructor: any, options: SchemaOptions): void;
}
declare let schemaStore: SchemaStore;
export { schemaStore };
export interface ConstraintOptions {
    optional?: boolean;
    groups?: string[];
    default?: any;
}
export declare function makeDefault<T>(value: T, defaults: any): T;
