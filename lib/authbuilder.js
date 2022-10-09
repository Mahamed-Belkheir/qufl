"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthBuilder = void 0;
class AuthBuilder {
    constructor(authenticator, isRequired = true, extractor = data => data, registeredMiddlewares = [], buildResult) {
        this.authenticator = authenticator;
        this.isRequired = isRequired;
        this.extractor = extractor;
        this.registeredMiddlewares = registeredMiddlewares;
        this.buildResult = buildResult;
        if (!buildResult) {
            this.buildResult = this.buildAuth;
        }
    }
    middleware(callback) {
        let c = this.clone();
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
    clone(newBuildResult) {
        let c = new AuthBuilder(this.authenticator, this.isRequired, this.extractor, [...this.registeredMiddlewares], this.buildResult);
        if (newBuildResult) {
            c.buildResult = newBuildResult;
        }
        return c;
    }
    RequestBasedExtractors(c) {
        return {
            cookieExtractor(cookie) {
                let c2 = c.clone();
                c2.extractor = (req) => {
                    return req.cookies[cookie];
                };
                return c2;
            },
            headerExtractor(header) {
                let c2 = c.clone();
                c2.extractor = (req) => {
                    return req.headers[header];
                };
                return c2;
            },
            bearerExtractor() {
                let c2 = c.clone();
                c2.extractor = (req) => {
                    let authHeader = req.headers["authorization"];
                    if (!authHeader || authHeader == "" || authHeader.length < 8) {
                        return null;
                    }
                    return authHeader.slice(7);
                };
                return c2;
            },
            customExtractor(callback) {
                let c2 = c.clone();
                c2.extractor = callback;
                return c2;
            }
        };
    }
    buildAuth(context) {
        let registeredMiddlewares = [...context.registeredMiddlewares];
        let authenticator = context.authenticator;
        return (data) => __awaiter(this, void 0, void 0, function* () {
            let id;
            try {
                id = yield authenticator(data);
            }
            catch (e) {
                if (context.isRequired) {
                    throw e;
                }
            }
            for (let cb of registeredMiddlewares) {
                id = yield cb(id);
            }
            return id;
        });
    }
    toFastifyMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone(((context) => {
            let authenticator = this.buildAuth(context);
            return function (req, _) {
                return __awaiter(this, void 0, void 0, function* () {
                    let token = context.extractor(req);
                    let id = yield authenticator(token);
                    req[t] = token;
                    req[k] = id;
                });
            };
        }));
        return this.RequestBasedExtractors(c);
    }
    toExpressMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone(context => {
            let authenticator = context.buildAuth(context);
            return (function (req, _, next) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        let token = context.extractor(req);
                        let id = yield authenticator(token);
                        req[k] = id;
                        req[t] = token;
                        yield next();
                    }
                    catch (e) {
                        if (context.isRequired) {
                            yield next(e);
                        }
                        else {
                            yield next();
                        }
                    }
                });
            });
        });
        return this.RequestBasedExtractors(c);
    }
    toKoaMiddleware() {
        let k = AuthBuilder.IdKey;
        let t = AuthBuilder.tokenKey;
        let c = this.clone((context) => (function (ctx, next) {
            return __awaiter(this, void 0, void 0, function* () {
                let authenticator = context.buildAuth(context);
                let token = context.extractor(ctx);
                let id = yield authenticator(token);
                ctx[k] = id;
                ctx[t] = token;
                yield next();
            });
        }));
        let extractors = this.RequestBasedExtractors(c);
        extractors.cookieExtractor = (cookie) => {
            let c2 = c.clone();
            c2.extractor = (req) => {
                return req.cookies.get(cookie);
            };
            return c2;
        };
        return extractors;
    }
    build() {
        return this.buildResult(this);
    }
    getId(reqOrCtx) {
        return reqOrCtx[AuthBuilder.IdKey];
    }
    getToken(reqOrCtx) {
        return reqOrCtx[AuthBuilder.tokenKey];
    }
}
exports.AuthBuilder = AuthBuilder;
AuthBuilder.IdKey = Symbol('Identity');
AuthBuilder.tokenKey = Symbol("token");
//# sourceMappingURL=authbuilder.js.map