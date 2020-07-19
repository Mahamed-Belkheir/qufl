const storeFactory = require('./tokenstore');

class Qufl {
    constructor({JWT, secret, timeout = '15m'}) {
        this.jwt = JWT;
        this.secret = secret
        this.timeout = timeout
        this.store = storeFactory();
    }

    _verifyToken(token) {
        try {
            return this.jwt.verify(token, this.secret);
        } catch {
            return false;
        } 
    }

    _getToken(req) {
        let header = req.headers['authorization'];
        if (!header) return false;
        return header.slice(7)
    };
    

    signToken({agent, role, client='web', custom}) {
        const token = this.jwt.sign({ agent, role, client, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        const refresh = this.jwt.sign({ agent, role, client, type:"refresh", custom, }, this.secret);
        this.store.storeToken(agent, client);
        return { token, refresh }
    }

    refreshToken(refresh) {
        let { agent, role, client, custom } = refresh
        if (!this.store.checkToken(agent, client))
            throw Error("Refresh token removed");
        const token = this.jwt.sign({ agent, role, client, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        return token;
    }

    removeToken(agent, client) {
        this.store.deleteToken(agent, client);    
    }

    getValidator({role, type="token", predicate = ()=>true}) {
        return (req, res, next) => {
            let tokenString = this._getToken(req);
            if (!tokenString) {
                res.status(401).send({
                    error: "No token provided"
                });
                return;
            }
            let token = this._verifyToken(tokenString);
            if (!token) {
                res.status(401).send({
                    error: "Token Invalid"
                })
                return;
            }
            if (role && token.role != role ) {
                res.status(403).send({
                    error: "Invalid role"
                })
                return;
            } 
            if (token.type != type ) {
                res.status(403).send({
                    error: "Invalid type"
                })
                return;
            }
            if (!predicate(token.custom)) {
                res.status(403).send({
                    error: "Custom Auth check failed"
                })
                return;
            } 
            req.qufl = token;
            next()
        }
    }
}

module.exports = Qufl;