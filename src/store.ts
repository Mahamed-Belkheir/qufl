import {EventEmitter} from "events";
import { SessionStoreUnavailableException } from "./exceptions";
import memorystore from "memorystore";

export interface StoreInterface extends EventEmitter {
    new(options: any): StoreInterface
    get(id: string, cb?: (err: Error | null, value: any) => void): void
    set(id: string, value: any, cb?: (err: Error | null) => void): void
    destroy(id: string, cb?: (err: Error | null) => void): void
}

export class StoreFacade {
    private store: StoreInterface
    private storeReady: boolean = true;

    constructor(store?: (events: {Store: typeof EventEmitter}) => StoreInterface, storeOptions: any = {}) {
        if (!store) {
            store = memorystore as any;
        }
        let storeClass = store!({Store: EventEmitter});
        this.store = new storeClass(storeOptions);
        this.store.on('connect', () => {
            this.storeReady = true;
        });
        this.store.on('disconnect', () => {
            this.storeReady = false;
        });
     }

    public get(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.storeReady) reject(new SessionStoreUnavailableException());
            this.store.get(id, (err, value) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(value);
                }
            })
        })
    }

    public set(id: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.storeReady) reject(new SessionStoreUnavailableException());
            this.store.set(id, value, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
    }

    public destroy(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.storeReady) reject(new SessionStoreUnavailableException());
            this.store.destroy(id, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
    }
}


