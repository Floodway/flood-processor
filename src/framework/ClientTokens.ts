
export interface TokenCollection{
    [path:string]:ClientToken
}

export class ClientTokens{

    private tokens:  TokenCollection;
    private setTokens:  TokenCollection;


    constructor(tokens: TokenCollection){
        this.tokens = tokens;
        this.setTokens = {};
    }

    public setToken(name:string,token: ClientToken){
        this.tokens[name] = token;
        this.setTokens[name] = token;
    }
    public getToken(name: string): ClientToken{
        return this.tokens[name];
    }

}

export interface ClientToken{
    value: string;
    expires: Date;
}