function storeFactory() {
    return new MemoryStore()
}

class MemoryStore {
    constructor() {
        this.storage = new Map();
    }
    
    storeToken(agent, client) {
        let bucket = this.storage.get(agent);
        if (!bucket)
            this.storage.set(agent, new Set([client]))
        else
            bucket.add(client)
    }

    checkToken(agent, client) {
        let bucket = this.storage.get(agent);
        if (!bucket)
            return false;
        return bucket.has(client);
    }

    deleteToken(agent, client) {
        let bucket = this.storage.get(agent);
        if (!bucket)
            return;
        bucket.delete(client);
        if (bucket.size == 0)
            this.storage.delete(agent);
    }
}

module.exports = storeFactory;