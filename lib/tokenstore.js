function storeFactory() {
    return new MemoryStore()
}

class MemoryStore {
    constructor() {
        this.storage = new Map();
    }
    
    storeToken(sub, client) {
        let bucket = this.storage.get(sub);
        if (!bucket)
            this.storage.set(sub, new Set([client]))
        else
            bucket.add(client)
    }

    checkToken(sub, client) {
        let bucket = this.storage.get(sub);
        if (!bucket)
            return false;
        return bucket.has(client);
    }

    deleteToken(sub, client) {
        let bucket = this.storage.get(sub);
        if (!bucket)
            return;
        bucket.delete(client);
        if (bucket.size == 0)
            this.storage.delete(sub);
    }

    clear() {
        this.storage.clear()
    }
}

module.exports = storeFactory;