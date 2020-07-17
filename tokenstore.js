function storeFactory() {
    return new MemoryStore()
}

class MemoryStore {
    constructor() {
        this.storage = {};
    }
    
    storeToken(agent) {
        this.storage[agent] = true;
    }

    checkToken(agent) {
        return !!this.storage[agent];
    }

    deleteToken(agent) {
        delete this.storage[agent];
    }
}

module.exports = storeFactory;