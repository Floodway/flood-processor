import { Type } from "./Type";
export declare class StringSchema extends Type {
    private lengthN;
    private minLengthN;
    private maxLengthN;
    private trimB;
    private toUpperCaseB;
    private toLowerCaseB;
    private oneOfS;
    hasChildren(): boolean;
    toJSON(): {
        type: string;
        length: number;
        minLength: number;
        maxLength: number;
        trim: boolean;
        uppercase: boolean;
        lowercase: boolean;
    };
    static isStringSchema(input: Type): input is StringSchema;
    validate(data: any, callback: {
        (err: any, res: string): void;
    }, path?: string): void;
    oneOf(input: string[]): this;
    length(length: number): StringSchema;
    minLength(minLength: number): StringSchema;
    maxLength(maxLength: number): StringSchema;
    toUpperCase(uppercase?: boolean): StringSchema;
    toLowerCase(lowercase?: boolean): StringSchema;
    trim(trim?: boolean): StringSchema;
}
