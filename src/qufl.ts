import { NextFunction, Request, Response } from "express"
import { NoTokenException, InvalidTokenException, InvalidAudienceException, InvalidTokenTypeException, QuflBaseException, RefreshTokenExpiredException } from "./exceptions";
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
        store = undefined
    }  = { }
    ) {
        let options = { algorithm, cookieKey, passError, secret, tokenTimeout, store };
        if (!options.secret) {
            throw Error("no secret set");
        }
        this.store = new StoreFacade(options.store);
        this.options = options;
    }
    public cookieKey() {
        return this.options.cookieKey;
    }

    public async signToken(data: Omit<QuflToken, "type">) {
        let token: string = jwt.sign({ ...data, type: Token }, this.options.secret, {
            expiresIn: this.options.tokenTimeout,
            algorithm: this.options.algorithm as any
        });
        let refresh: string = jwt.sign({ ...data, type: Refresh }, this.options.secret, {
            algorithm: this.options.algorithm as any
        });
        await this.store.set(data.aud + ":" + data.sub, true)
        return { token, refresh }
    }

    public async refreshToken(refreshToken: QuflToken) {
        let result = await this.store.get(refreshToken.aud + ":" + refreshToken.sub);
        if (!result) {
            throw new RefreshTokenExpiredException();
        }
        let token: string = jwt.sign({
            sub: refreshToken.sub,
            aud: refreshToken.aud,
            type: Token,
            payload: refreshToken.payload
        } as QuflToken, this.options.secret, {
            expiresIn: this.options.tokenTimeout,
            algorithm: this.options.algorithm as any
        })
        return token;
    }

    public async removeToken(token: QuflToken) {
        await this.store.destroy(token.aud + ":" + token.sub);
    }

    private verifyToken(tokenString: string): QuflToken {
        try {
            let token = jwt.verify(tokenString, this.options.secret, {
                algorithms: this.options.algorithm as any
            })
            return token as QuflToken;
        } catch {
            throw new InvalidTokenException();
        }
    }

    private errorResponse(err: Error, res: Response) {
        let code = 500;
        if (err instanceof QuflBaseException) {
            code = err.statusCode;
        }
        res.status(code).send({
            message: err.message
        })
    }

    public extractors: { [key: string]: TokenExtractor } = {
        bearer: (req: Request) => {
            let header = req.headers['authorization'];
            if (!header) throw new NoTokenException();
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
        options.tokenType ??= "token";
        if (options.customExtractor) {
            extractor = options.customExtractor;
        } else {
            extractor = this.extractorMapping[options.tokenType!];
        }
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                let tokenString = extractor(req);
                let token = this.verifyToken(tokenString);
                if (options.tokenType != token.type) {
                    throw new InvalidTokenTypeException();
                }
                if (options.audience) {
                    if (token.aud != options.audience) throw new InvalidAudienceException();
                }
                if (options.customValidator) {
                    let validated = options.customValidator(token, req, res);
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
}

export type QuflToken = {
    sub: string
    aud?: string
    type: TokenType
    payload?: {
        [key: string]: any
    }
}

type TokenType = "token" | "refresh"
const Token: TokenType = "token";
const Refresh: TokenType = "refresh";

export type AuthOptions = {
    audience?: string,
    tokenType?: TokenType,
    customValidator?: (token: QuflToken, req: Request, res: Response) => Promise<boolean | void>
    customExtractor?: TokenExtractor
}

export type QuflOptions = {
    tokenTimeout: number | string
    secret: string
    cookieKey: string
    algorithm: string
    passError: boolean
    store?: (events: typeof EventEmitter) => StoreInterface
}

export type TokenExtractor = (req: Request) => string;

declare global {
    namespace Express {
        interface Request {
            qufl: QuflToken
        }
    }
}