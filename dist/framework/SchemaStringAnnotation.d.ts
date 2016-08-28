import { ConstraintOptions } from "./SchemaStore";
export interface StringOptions extends ConstraintOptions {
    length?: number;
    minLength?: number;
    maxLength?: number;
    toLowerCase?: boolean;
    toUpperCase?: boolean;
    trim?: boolean;
    whitelist?: string[];
    blacklist?: string[];
}
export declare function Str(options: StringOptions): (c: any, name: string) => void;
