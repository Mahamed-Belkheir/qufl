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
exports.OpaqueStrategy = exports.OpaqueTokenNotFound = void 0;
const store_1 = require("../store");
const util_1 = require("../util");
class OpaqueTokenNotFound extends Error {
    constructor() {
        super(...arguments);
        this.message = "invalid token";
        this.code = 401;
    }
}
exports.OpaqueTokenNotFound = OpaqueTokenNotFound;
class OpaqueStrategy {
    constructor(store = new store_1.StoreFacade(), mapToId = d => d, options = {
        touch: true,
    }) {
        this.store = store;
        this.mapToId = mapToId;
        this.options = options;
        this.issueToken = (data) => __awaiter(this, void 0, void 0, function* () {
            let token = (0, util_1.randomHash)();
            yield this.store.set(token, JSON.stringify(data));
            return token;
        });
        this.authenticateToken = (token) => __awaiter(this, void 0, void 0, function* () {
            let id = yield this.store.get(token);
            if (!id)
                throw new OpaqueTokenNotFound;
            if (this.options.touch) {
                yield this.store.touch(token, id);
            }
            return this.mapToId(JSON.parse(id));
        });
        this.invalidateToken = (token) => __awaiter(this, void 0, void 0, function* () {
            yield this.store.destroy(token);
        });
    }
}
exports.OpaqueStrategy = OpaqueStrategy;
//# sourceMappingURL=opaque.js.map