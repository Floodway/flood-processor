import { Type } from "./Type";
export declare class NumberSchema extends Type {
    private allowDecimalsB;
    private roundB;
    private floorB;
    private ceilB;
    private minN;
    private maxN;
    private blackListN;
    private whiteListN;
    hasChildren(): boolean;
    static isNumberSchema(input: Type): input is NumberSchema;
    toJSON(): {
        type: string;
        allowDecimals: boolean;
        round: boolean;
        floor: boolean;
        ceil: boolean;
        min: Number;
        max: Number;
        blacklist: Number[];
        whitelist: Number[];
    };
    validate(data: any, callback: {
        (err: any, res: string): void;
    }, path?: string): void;
    allowsDecimals(): boolean;
    ceil(value: boolean): NumberSchema;
    floor(value: boolean): NumberSchema;
    round(value: boolean): NumberSchema;
    allow(values: Number[]): NumberSchema;
    disallow(values: Number[]): NumberSchema;
}
