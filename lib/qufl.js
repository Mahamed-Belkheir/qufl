const storeFactory = require('./tokenstore');

class Qufl {
    constructor({jwt, secret, timeout = '15m'}) {
        this.jwt = jwt;
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
    

    signToken({sub, aud='api', client='web', custom}) {
        const token = this.jwt.sign({ sub, aud, client, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        const refresh = this.jwt.sign({ sub, aud, client, type:"refresh", custom, }, this.secret);
        this.store.storeToken(sub, client);
        return { token, refresh }
    }

    refreshToken(refresh) {
        let { sub, aud, client, custom } = refresh
        if (!this.store.checkToken(sub, client))
            throw Error("Refresh token removed");
        const token = this.jwt.sign({ sub, aud, client, type:"token", custom, }, this.secret, { expiresIn: this.timeout });
        return token;
    }

    removeToken({sub, client}) {
        this.store.deleteToken(sub, client);    
    }

    getValidator({aud='api', type="token", predicate = ()=>true} = {}) {
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
            if (aud && token.aud != aud ) {
                res.status(403).send({
                    error: "Invalid aud"
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

    changeSecret(newSecret) {
        this.secret = newSecret
        this.store.clear();
    }
}

module.exports = Qufl;