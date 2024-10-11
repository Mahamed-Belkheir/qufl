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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTStrategy = exports.JWTRefreshTokenInvalid = exports.JWTAccessTokenInvalid = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("../store");
const util_1 = require("../util");
class JWTAccessTokenInvalid extends Error {
    constructor() {
        super(...arguments);
        this.message = "invalid access token";
        this.code = 401;
    }
}
exports.JWTAccessTokenInvalid = JWTAccessTokenInvalid;
class JWTRefreshTokenInvalid extends Error {
    constructor() {
        super(...arguments);
        this.message = "invalid refresh token";
        this.code = 401;
    }
}
exports.JWTRefreshTokenInvalid = JWTRefreshTokenInvalid;
class JWTStrategy {
    constructor(store = new store_1.StoreFacade(), options = {
        secret: (0, util_1.randomHash)(),
        algoritm: "HS256",
        expireIn: "10m",
        touch: true,
        serializer: (data) => JSON.stringify(data)
    }, mapToId = d => d) {
        this.store = store;
        this.options = options;
        this.mapToId = mapToId;
        this.issueToken = (data) => __awaiter(this, void 0, void 0, function* () {
            let refresh = (0, util_1.randomHash)();
            let token = yield this.issueTokenWithoutRefresh(data);
            yield this.store.set(refresh, this.options.serializer(data));
            return [token, refresh];
        });
        this.authenticateToken = (token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const secret = this.options.publicKey || this.options.secret;
                let { data } = jsonwebtoken_1.default.verify(token, secret, {
                    algorithms: this.options.algoritm,
                });
                return this.mapToId(data);
            }
            catch (_a) {
                throw new JWTAccessTokenInvalid();
            }
        });
        this.refreshToken = (token) => __awaiter(this, void 0, void 0, function* () {
            let data = yield this.store.get(token);
            if (!data)
                throw new JWTRefreshTokenInvalid();
            if (this.options.touch) {
                yield this.store.touch(token, data);
            }
            data = JSON.parse(data);
            return jsonwebtoken_1.default.sign({
                data,
            }, this.options.secret, {
                algorithm: this.options.algoritm,
                expiresIn: this.options.expireIn,
            });
        });
        this.issueTokenWithoutRefresh = (data) => __awaiter(this, void 0, void 0, function* () {
            let token = jsonwebtoken_1.default.sign({
                data,
            }, this.options.secret, {
                algorithm: this.options.algoritm,
                expiresIn: this.options.expireIn,
            });
            return token;
        });
        this.authenticateRefresh = (token) => __awaiter(this, void 0, void 0, function* () {
            let data = yield this.store.get(token);
            if (!data)
                throw new JWTRefreshTokenInvalid();
            if (this.options.touch) {
                yield this.store.touch(token, data);
            }
            data = JSON.parse(data);
            data = this.mapToId(data);
            return [data, token];
        });
        this.invalidateRefresh = (token) => __awaiter(this, void 0, void 0, function* () {
            yield this.store.destroy(token);
        });
    }
}
exports.JWTStrategy = JWTStrategy;
//# sourceMappingURL=jwt.js.map