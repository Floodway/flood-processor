export interface TokenCollection {
    [path: string]: ClientToken;
}
export declare class ClientTokens {
    private tokens;
    private setTokens;
    constructor(tokens: TokenCollection);
    setToken(name: string, token: ClientToken): void;
    getToken(name: string): ClientToken;
}
export interface ClientToken {
    value: string;
    expires: Date;
}
