const storeFactory = require('./tokenstore');
const validatorFactory = require('./validation')

class Qufl {
    constructor(JWT, secret, timeout = '15m') {
        this.jwt = JWT;
        this.secret = secret
        this.timeout = timeout
        this.store = storeFactory();
    }

    signToken(agent, role, custom) {
        const token = this.jwt.sign({ agent, role, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        const refresh = this.jwt.sign({ agent, role, type:"refresh", custom, }, this.secret);
        this.store.storeToken(agent);
        return { token, refresh }
    }

    refreshToken(refresh) {
        let { agent, role, custom } = refresh
        if (!this.store.checkToken(agent))
            throw Error("Refresh token removed");
        const token = this.jwt.sign({ agent, role, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        return { token };
    }

    removeToken(agent) {
        this.store.deleteToken(agent);    
    }

    getValidator() {

    }
}