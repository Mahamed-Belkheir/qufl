/// <reference types="node" />
import { EventEmitter } from "events";
export declare class SessionStoreUnavailableException extends Error {
    code: 500;
    message: "session store unavailable";
}
export interface StoreInterface extends EventEmitter {
    new (options: any): StoreInterface;
    get(id: string, cb?: (err: Error | null, value: any) => void): void;
    set(id: string, value: any, cb?: (err: Error | null) => void): void;
    destroy(id: string, cb?: (err: Error | null) => void): void;
    touch?: (id: string, value: any, cb?: (err: Error | null) => void) => void;
}
export declare class StoreFacade {
    private store;
    private storeReady;
    constructor(store?: (events: {
        Store: typeof EventEmitter;
    }) => StoreInterface, storeOptions?: any);
    get(id: string): Promise<any>;
    set(id: string, value: any): Promise<void>;
    destroy(id: string): Promise<void>;
    touch(id: string, value: any): Promise<void>;
}
