"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomHash = void 0;
const crypto_1 = __importDefault(require("crypto"));
function randomHash(length = 32) {
    return crypto_1.default.randomBytes(length).toString("hex");
}
exports.randomHash = randomHash;
//# sourceMappingURL=util.js.map