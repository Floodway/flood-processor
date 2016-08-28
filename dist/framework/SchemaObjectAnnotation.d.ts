import { ConstraintOptions } from "./SchemaStore";
export interface ObjectOptions extends ConstraintOptions {
    child: Function;
    group?: string;
}
export declare function Child(options: ObjectOptions): (c: any, name: string) => void;
