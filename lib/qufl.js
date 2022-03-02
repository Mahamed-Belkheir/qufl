"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exceptions = void 0;
const exceptions = __importStar(require("./exceptions"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("./store");
class Qufl {
    constructor({ algorithm = "HS256", cookieKey = "QUFLTOKENKEY", passError = false, secret = "", tokenTimeout = "1h", store = undefined, storeOptions = {}, } = {}) {
        this.extractors = {
            bearer: (req) => {
                let header = req.headers['authorization'];
                if (!header)
                    throw new exceptions.NoTokenException();
                return header.slice(7);
            },
            cookie: (req) => {
                return req.cookies[this.options.cookieKey];
            },
            secureCookie: (req) => {
                return req.signedCookies[this.options.cookieKey];
            }
        };
        this.extractorMapping = {
            [Token]: this.extractors.bearer,
            [Refresh]: this.extractors.cookie
        };
        this.auth = (options = {}) => {
            var _a;
            let extractor;
            (_a = options.type) !== null && _a !== void 0 ? _a : (options.type = "token");
            if (options.extractor) {
                extractor = options.extractor;
            }
            else {
                extractor = this.extractorMapping[options.type];
            }
            return (req, res, next) => {
                try {
                    let tokenString = extractor(req);
                    let token = this.verifyToken(tokenString);
                    if (options.type != token.type) {
                        throw new exceptions.InvalidTokenTypeException();
                    }
                    if (options.aud) {
                        if (token.aud != options.aud)
                            throw new exceptions.InvalidAudienceException();
                    }
                    if (options.validator) {
                        let validated = options.validator(token, req, res);
                        if (!validated)
                            return;
                    }
                    req.qufl = token;
                    next();
                }
                catch (err) {
                    if (options.allowGuest && err instanceof exceptions.QuflBaseException) {
                        next();
                    }
                    else if (this.options.passError) {
                        next(err);
                    }
                    else {
                        this.errorResponse(err, res);
                    }
                }
            };
        };
        let options = { algorithm, cookieKey, passError, secret, tokenTimeout, store, storeOptions };
        if (!options.secret) {
            throw Error("no secret set");
        }
        this.store = new store_1.StoreFacade(options.store, options.storeOptions);
        this.options = options;
    }
    cookieKey() {
        return this.options.cookieKey;
    }
    signToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let sessionId = String(Date.now());
            let token = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, data), { type: Token, sessionId }), this.options.secret, {
                expiresIn: this.options.tokenTimeout,
                algorithm: this.options.algorithm
            });
            let refresh = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, data), { type: Refresh, sessionId }), this.options.secret, {
                algorithm: this.options.algorithm
            });
            yield this.store.set(sessionId + ":" + data.sub + ":" + data.aud, true);
            return { token, refresh };
        });
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (refreshToken.type != "refresh") {
                throw new exceptions.InvalidTokenTypeException();
            }
            let result = yield this.store.get(refreshToken.sessionId + ":" + refreshToken.sub + ":" + refreshToken.aud);
            if (!result) {
                throw new exceptions.RefreshTokenExpiredException();
            }
            let token = jsonwebtoken_1.default.sign({
                sub: refreshToken.sub,
                aud: refreshToken.aud,
                type: Token,
                sessionId: refreshToken.sessionId,
                payload: refreshToken.payload
            }, this.options.secret, {
                expiresIn: this.options.tokenTimeout,
                algorithm: this.options.algorithm
            });
            return token;
        });
    }
    removeToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.destroy(token.sessionId + ":" + token.sub + ":" + token.aud);
        });
    }
    verifyToken(tokenString) {
        try {
            let token = jsonwebtoken_1.default.verify(tokenString, this.options.secret, {
                algorithms: this.options.algorithm
            });
            return token;
        }
        catch (_a) {
            throw new exceptions.InvalidTokenException();
        }
    }
    errorResponse(err, res) {
        let code = 500;
        if (err instanceof exceptions.QuflBaseException) {
            code = err.statusCode;
        }
        res.status(code).send({
            message: err.message
        });
    }
    changeSecret(secret) {
        this.options.secret = secret;
    }
}
exports.default = Qufl;
const Token = "token";
const Refresh = "refresh";
exports.Exceptions = exceptions;
//# sourceMappingURL=qufl.js.map