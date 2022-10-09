declare type ExpressMiddleware = (req: any, res: any, next: any) => Promise<void>;
declare type FastifyMiddleware = (req: any, res: any) => Promise<void>;
declare type KoaMiddleware = (ctx: any, next: any) => Promise<void>;
declare type NormalFunc = (data: any) => Promise<any>;
export declare type PossibleResults = ExpressMiddleware | FastifyMiddleware | KoaMiddleware | NormalFunc;
export declare class AuthBuilder<T, BuildResult extends PossibleResults = NormalFunc> {
    private authenticator;
    private isRequired;
    private extractor;
    private registeredMiddlewares;
    private buildResult?;
    private static IdKey;
    private static tokenKey;
    constructor(authenticator: (data: any) => Promise<T> | T, isRequired?: boolean, extractor?: (...data: any[]) => any, registeredMiddlewares?: any[], buildResult?: ((context: AuthBuilder<T, any>) => BuildResult) | undefined);
    middleware(callback: (t: T) => Promise<T> | T): AuthBuilder<T, BuildResult>;
    required(): AuthBuilder<T, NormalFunc>;
    notRequired(): AuthBuilder<T, NormalFunc>;
    clone<R extends PossibleResults = NormalFunc>(newBuildResult?: (context: AuthBuilder<T, R>) => R): AuthBuilder<T, R>;
    private RequestBasedExtractors;
    private buildAuth;
    toFastifyMiddleware(): {
        cookieExtractor(cookie: string): AuthBuilder<T, FastifyMiddleware>;
        headerExtractor(header: string): AuthBuilder<T, FastifyMiddleware>;
        bearerExtractor(): AuthBuilder<T, FastifyMiddleware>;
        customExtractor(callback: (data: any) => any): AuthBuilder<T, FastifyMiddleware>;
    };
    toExpressMiddleware(): {
        cookieExtractor(cookie: string): AuthBuilder<T, ExpressMiddleware>;
        headerExtractor(header: string): AuthBuilder<T, ExpressMiddleware>;
        bearerExtractor(): AuthBuilder<T, ExpressMiddleware>;
        customExtractor(callback: (data: any) => any): AuthBuilder<T, ExpressMiddleware>;
    };
    toKoaMiddleware(): {
        cookieExtractor(cookie: string): AuthBuilder<T, KoaMiddleware>;
        headerExtractor(header: string): AuthBuilder<T, KoaMiddleware>;
        bearerExtractor(): AuthBuilder<T, KoaMiddleware>;
        customExtractor(callback: (data: any) => any): AuthBuilder<T, KoaMiddleware>;
    };
    build(): BuildResult;
    getId(reqOrCtx: any): T;
    getToken(reqOrCtx: any): string;
}
export {};
