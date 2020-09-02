const storeFactory = require('./tokenstore');
const { NoToken, InvalidToken, InvalidAudience, InvalidType, CustomAuthCheckFailed, RefreshTokenInvalidated } = require('./exceptions')

class Qufl {
    constructor({jwt, secret, timeout = '15m', useMiddleware = false}) {
        this.jwt = jwt;
        this.secret = secret
        this.timeout = timeout
        this.store = storeFactory();
        this.useMiddleware = useMiddleware
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
    

    async signToken({sub, aud='api', client='web', ...custom}) {
        const token = this.jwt.sign({ sub, aud, client, type:"token", ...custom }, this.secret, { expiresIn: this.timeout });
        const refresh = this.jwt.sign({ sub, aud, client, type:"refresh", ...custom }, this.secret);
        await this.store.storeToken(sub, client);
        return { token, refresh }
    }

    async refreshToken(refresh) {
        let { sub, client } = refresh
        if (! await this.store.checkToken(sub, client))
            throw new RefreshTokenInvalidated();
        const token = this.jwt.sign({ ...refresh, type:"token" }, this.secret, { expiresIn: this.timeout });
        return token;
    }

    async removeToken({sub, client}) {
        await this.store.deleteToken(sub, client);    
    }

    getValidator({aud, type="token", predicate = ()=>true} = {}) {
        const useMiddleware = this.useMiddleware
        return async (req, res, next) => {
            try {
                let tokenString = this._getToken(req);
                if (!tokenString) {
                    throw new NoToken()
                }
                let token = this._verifyToken(tokenString);
                if (!token) {
                    throw new InvalidToken()
                }
                if (aud && token.aud != aud ) {
                    throw new InvalidAudience(aud, token.aud);
                } 
                if (token.type != type ) {
                    throw new InvalidType(type, token.type);
                }
                if (! await predicate(token)) {
                    throw new CustomAuthCheckFailed()
                } 
                req.qufl = token;
            } catch (e) {
                if (useMiddleware) {
                    next(e);
                    return;
                } else {
                    res.status(e.statusCode).send({
                        error: e.message
                    });
                    return;
                }
            }
            next()
        }
    }

    async changeSecret(newSecret) {
        this.secret = newSecret
        await this.store.clear();
    }
}

module.exports = Qufl;