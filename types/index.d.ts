export = Qufl

declare class Qufl {
    constructor(options: Qufl.QuflOptions);

    signToken(options: {sub: string, aud?: string, client?: string, custom: any }): Promise<{ token: string, refresh: string }>
    
    refreshToken(validToken: { sub: string, client: string }): Promise<string>
    
    removeToken(validToken: { sub: string, client: string }): Promise<void>
    
    getValidator(options?: {aud?: string, type?: string, predicate?: (token: Qufl.QuflToken) => boolean }): (req, res, next) => Promise<void>
    
    changeSecret(newString: string): Promise<void>
}

declare namespace Qufl {
    export interface QuflToken {
        sub: string
        aud: string
        type: string
        custom?: any
    }
    interface JWTInterface {
        verify(token: string, secret: string): string | object
        sign(payload: string | object | Buffer, secret: string): string;
    }
    interface QuflOptions {
        jwt: JWTInterface
        secret: string
        timeout?: number | string
        useMiddleware?: boolean
    }

}

declare global {
    namespace Express {
        interface Request {
            qufl: Qufl.QuflToken
        }
    }
}