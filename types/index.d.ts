export declare class Qufl {
    constructor(options: QuflOptions)
    signToken(options: {sub: string, aud?: string, client?: string, custom: any }): Promise<{ token: string, refresh: string }>
    refreshToken(validToken: { sub: string, client: string }): Promise<string>
    removeToken(validToken: { sub: string, client: string }): Promise<void>
    getValidator(options: {aud?: string, type?: string, predicate: (token: QuflToken) => boolean }): (req, res, next) => Promise<void>
    changeSecret(newString: string): Promise<void>
}

export declare interface QuflOptions {
    jwt: JWTInterface
    secret: string
    timeout?: number | string
    useMiddleware?: boolean
}

export declare interface JWTInterface {
    verify(token: string, secret: string): string | object
    sign(payload: string | object | Buffer, secret: string): string;
}

export declare interface QuflToken {
    sub: string
    aud: string
    type: string
    custom: any
}

declare global{
    namespace Express {
        interface Request {
            qufl: QuflToken | undefined
        }
    }
}