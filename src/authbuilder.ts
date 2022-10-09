
type ExpressMiddleware = (req: any, res: any, next: any) => Promise<void>
type FastifyMiddleware = (req: any, res: any) => Promise<void>
type KoaMiddleware = (ctx: any, next: any) => Promise<void>
type NormalFunc = (data: any) => Promise<any> 

export type PossibleResults =  ExpressMiddleware | FastifyMiddleware | KoaMiddleware | NormalFunc

export class AuthBuilder<T, BuildResult extends PossibleResults = NormalFunc> {
    private static IdKey = Symbol('Identity')
    private static tokenKey = Symbol("token")
    constructor(
        private authenticator: (data: any) => Promise<T> | T,
        private isRequired: boolean = true,
        private extractor: (...data: any[]) => any = data => data,
        private registeredMiddlewares: any[] = [],
        private buildResult?: (context: AuthBuilder<T, any>) => BuildResult
    ) {
        if (!buildResult) {
            //@ts-ignore
            this.buildResult = this.buildAuth;
        }
    }

    middleware(callback: (t: T) => Promise<T> | T) {
        let c = this.clone<BuildResult>()
        c.registeredMiddlewares.push(callback);
        return c;
    }

    required() {
        let c = this.clone();
        c.isRequired = true;
        return c;
    }

    notRequired() {
        let c = this.clone();
        c.isRequired = false;
        return c;
    }

    clone<R extends PossibleResults = NormalFunc>( newBuildResult?: (context: AuthBuilder<T, R>) => R) {
        let c = new AuthBuilder<T, R>(
            this.authenticator,
            this.isRequired,
            this.extractor,
            [...this.registeredMiddlewares],
            //@ts-ignore
            this.buildResult!,
        )
        if (newBuildResult) {
            c.buildResult = newBuildResult
        }
        return c;
    }

    private RequestBasedExtractors<R extends PossibleResults>(c: AuthBuilder<T, R>) {
        return {
            cookieExtractor(cookie: string) {
                let c2 = c.clone<R>()
                c2.extractor = (req: any) => {
                    return req.cookies[cookie]
                }
                return c2;
            },
            headerExtractor(header: string) {
                let c2 = c.clone<R>()
                c2.extractor = (req: any) => {
                    return req.headers[header]
                }
                return c2;
            },
            bearerExtractor() {
                let c2 = c.clone<R>()
                c2.extractor = (req: any) => {
                    let authHeader = req.headers["authorization"];
                    if (!authHeader || authHeader == "" || authHeader.length < 8) {
                        return null;
                    }
                    return authHeader.slice(7)
                }
                return c2;
            },
            customExtractor(callback: (data: any) => any) {
                let c2 = c.clone<R>()
                c2.extractor = callback
                return c2;
            }
    
        }
    }


    private buildAuth(context: AuthBuilder<T, any>) {
        let registeredMiddlewares = [...context.registeredMiddlewares]
        let authenticator = context.authenticator;
        return async (data: any) => {
            let id;
            try {
                id = await authenticator(data)
            } catch(e) {
                if (context.isRequired) {
                    throw e;
                }
            }
            for (let cb of registeredMiddlewares) {
                id = await cb(id);
            }
            return id;
        }
    }

    toFastifyMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone<FastifyMiddleware>(((context) => {
            let authenticator = this.buildAuth(context);
            return async function (req, _) {
                let token = context.extractor(req);
                let id = await authenticator(token);
                req[t] = token;
                req[k] = id;
            }
        }));
        return this.RequestBasedExtractors<FastifyMiddleware>(c)
    }

    toExpressMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone<ExpressMiddleware>(context => {
            let authenticator = context.buildAuth(context);
            return (async function (req: any, _: any, next: any) {
                try {
                    let token = context.extractor(req);
                    let id = await authenticator(token);
                    req[k] = id;
                    req[t] = token;
                    await next();
                } catch (e) {
                    if (context.isRequired) {
                        await next(e)
                    } else {
                        await next();
                    }
                }
        })
        });
        return this.RequestBasedExtractors<ExpressMiddleware>(c)
    }

    toKoaMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone<KoaMiddleware>((context) => (async function (ctx: any, next: any) {
            let authenticator = context.buildAuth(context);
            let token = context.extractor(ctx);
            let id = await authenticator(token);
            ctx[k] = id;
            ctx[t] = token;
            await next()
        }));
        let extractors = this.RequestBasedExtractors<KoaMiddleware>(c)
        extractors.cookieExtractor = (cookie: string) => {
            let c2 = c.clone<KoaMiddleware>()
            c2.extractor = (req: any) => {
                return req.cookies.get(cookie);
            }
            return c2;
        }
        return extractors;
    }

    build(): BuildResult {
        return this.buildResult!(this)
    }


    getId(reqOrCtx: any) {
        return  reqOrCtx[AuthBuilder.IdKey] as T
    }

    getToken(reqOrCtx: any) {
        return reqOrCtx[AuthBuilder.tokenKey] as string;
    }

}
