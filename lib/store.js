"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreFacade = exports.SessionStoreUnavailableException = void 0;
const events_1 = require("events");
const memorystore_1 = __importDefault(require("memorystore"));
class SessionStoreUnavailableException extends Error {
}
exports.SessionStoreUnavailableException = SessionStoreUnavailableException;
class StoreFacade {
    constructor(store, storeOptions = {}) {
        this.storeReady = true;
        if (!store) {
            store = memorystore_1.default;
        }
        let storeClass = store({ Store: events_1.EventEmitter });
        this.store = new storeClass(storeOptions);
        this.store.on('connect', () => {
            this.storeReady = true;
        });
        this.store.on('disconnect', () => {
            this.storeReady = false;
        });
    }
    get(id) {
        return new Promise((resolve, reject) => {
            if (!this.storeReady)
                reject(new SessionStoreUnavailableException());
            this.store.get(id, (err, value) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(value);
                }
            });
        });
    }
    set(id, value) {
        return new Promise((resolve, reject) => {
            if (!this.storeReady)
                reject(new SessionStoreUnavailableException());
            this.store.set(id, value, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    destroy(id) {
        return new Promise((resolve, reject) => {
            if (!this.storeReady)
                reject(new SessionStoreUnavailableException());
            this.store.destroy(id, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    touch(id, value) {
        return new Promise((resolve, reject) => {
            if (!this.storeReady)
                reject(new SessionStoreUnavailableException());
            if (this.store.touch) {
                this.store.touch(id, value, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    }
}
exports.StoreFacade = StoreFacade;
//# sourceMappingURL=store.js.map