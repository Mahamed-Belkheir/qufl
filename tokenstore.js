function storeFactory() {
    return new MemoryStore()
}

class MemoryStore {
    constructor() {
        this.storage = {};
    }
    
    storeToken(agent, client) {
        this.storage[agent+client] = true;
    }

    checkToken(agent, client) {
        return !!this.storage[agent+client];
    }

    deleteToken(agent, client) {
        delete this.storage[agent+client];
    }
}

module.exports = storeFactory;