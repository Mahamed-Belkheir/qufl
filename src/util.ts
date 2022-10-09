import crypto from "crypto"

export function randomHash(length = 32) {
    return crypto.randomBytes(length).toString("hex");
}