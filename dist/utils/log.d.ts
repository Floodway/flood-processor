export declare enum Output {
    Out = 0,
    Error = 1,
}
export declare class Log {
    private key;
    constructor(key: string);
    getTime(): string;
    log(data: string): void;
    debug(data: string): void;
    success(data: string): void;
    error(data: string): void;
    static print(message: String, output: Output): void;
}
