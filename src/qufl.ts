import { NextFunction, Request, Response } from "express"
import * as exceptions from "./exceptions";
import jwt from "jsonwebtoken";
import { StoreFacade, StoreInterface } from "./store";
import EventEmitter from "events";


export default class Qufl {
    private options: QuflOptions
    private store: StoreFacade
    constructor(
        { algorithm = "HS256",
        cookieKey = "QUFLTOKENKEY",
        passError = false,
        secret = "",
        tokenTimeout = "1h",
        store = undefined,
        storeOptions = {},
    }  = { }
    ) {
        let options = { algorithm, cookieKey, passError, secret, tokenTimeout, store, storeOptions };
        if (!options.secret) {
            throw Error("no secret set");
        }
        this.store = new StoreFacade(options.store, options.storeOptions);
        this.options = options;
    }
    public cookieKey() {
        return this.options.cookieKey;
    }

    public async signToken(data: Omit<QuflToken, "type" | "sessionId">) {
        let sessionId = String(Date.now());
        let token: string = jwt.sign({ ...data, type: Token, sessionId }, this.options.secret, {
            expiresIn: this.options.tokenTimeout,
            algorithm: this.options.algorithm as any
        });
        let refresh: string = jwt.sign({ ...data, type: Refresh, sessionId}, this.options.secret, {
            algorithm: this.options.algorithm as any
        });
        await this.store.set(sessionId +":"+data.sub+":"+data.aud, true)
        return { token, refresh }
    }

    public async refreshToken(refreshToken: QuflToken) {
        if (refreshToken.type != "refresh") {
            throw new exceptions.InvalidTokenTypeException();
        }
        let result = await this.store.get(refreshToken.sessionId +":"+refreshToken.sub+":"+refreshToken.aud);
        if (!result) {
            throw new exceptions.RefreshTokenExpiredException();
        }
        let token: string = jwt.sign({
            sub: refreshToken.sub,
            aud: refreshToken.aud,
            type: Token,
            sessionId: refreshToken.sessionId,
            payload: refreshToken.payload
        } as QuflToken, this.options.secret, {
            expiresIn: this.options.tokenTimeout,
            algorithm: this.options.algorithm as any
        })
        return token;
    }

    public async removeToken(token: QuflToken) {
        await this.store.destroy(token.sessionId +":"+token.sub+":"+token.aud);
    }

    private verifyToken(tokenString: string): QuflToken {
        try {
            let token = jwt.verify(tokenString, this.options.secret, {
                algorithms: this.options.algorithm as any
            })
            return token as QuflToken;
        } catch {
            throw new exceptions.InvalidTokenException();
        }
    }

    private errorResponse(err: Error, res: Response) {
        let code = 500;
        if (err instanceof exceptions.QuflBaseException) {
            code = err.statusCode;
        }
        res.status(code).send({
            message: err.message
        })
    }

    public extractors: { [key: string]: TokenExtractor } = {
        bearer: (req: Request) => {
            let header = req.headers['authorization'];
            if (!header) throw new exceptions.NoTokenException();
            return header.slice(7)
        },
        cookie: (req: Request) => {
            return req.cookies[this.options.cookieKey];
        },
        secureCookie: (req: Request) => {
            return req.signedCookies[this.options.cookieKey];
        }
    }

    public extractorMapping: { [key: string]: TokenExtractor } = {
        [Token]: this.extractors.bearer,
        [Refresh]: this.extractors.cookie
    }

    public auth = (options: AuthOptions = {}) => {
        let extractor: TokenExtractor;
        options.type ??= "token";
        if (options.extractor) {
            extractor = options.extractor;
        } else {
            extractor = this.extractorMapping[options.type!];
        }
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                let tokenString = extractor(req);
                let token = this.verifyToken(tokenString);
                if (options.type != token.type) {
                    throw new exceptions.InvalidTokenTypeException();
                }
                if (options.aud) {
                    if (token.aud != options.aud) throw new exceptions.InvalidAudienceException();
                }
                if (options.validator) {
                    let validated = options.validator(token, req, res);
                    if (!validated) return;
                }
                req.qufl = token;
                next();
            } catch (err) {
                if (this.options.passError) {
                    next(err)
                }
                else {
                    this.errorResponse(err, res);
                }
            }
        }
    }

    public changeSecret(secret: string) {
        this.options.secret = secret;
    }
}

export type QuflToken = {
    sub: string
    aud?: string
    type: TokenType
    sessionId: string
    payload?: {
        [key: string]: any
    }
}

type TokenType = "token" | "refresh"
const Token: TokenType = "token";
const Refresh: TokenType = "refresh";

export type AuthOptions = {
    aud?: string,
    type?: TokenType,
    validator?: (token: QuflToken, req: Request, res: Response) => Promise<boolean | void>
    extractor?: TokenExtractor
}

export type QuflOptions = {
    tokenTimeout: number | string
    secret: string
    cookieKey: string
    algorithm: string
    passError: boolean
    store?: (events: typeof EventEmitter) => StoreInterface
    storeOptions?: any
}

export type TokenExtractor = (req: Request) => string;

declare global {
    namespace Express {
        interface Request {
            qufl: QuflToken
        }
    }
}

export const Exceptions = exceptions;