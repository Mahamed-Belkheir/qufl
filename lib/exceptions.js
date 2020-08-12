class NoToken extends Error {
    constructor() {
        super("No token is provided in the header")
        this.statusCode = 401;
    }
}

class InvalidToken extends Error {
    constructor() {
        super("Token provided is invalid")
        this.statusCode = 401;
    }
}

class InvalidAudience extends Error {
    constructor(wantedAud, isAud) {
        super(`Invalid token audience, Route audience is ${wantedAud}, recieved ${isAud}`)
        this.statusCode = 403;
    }
}

class InvalidType extends Error {
    constructor(wantedType, isType) {
        super(`Invalid token type, route type is ${wantedType}, recieved ${isType}`)
        this.statusCode = 403;
    }
}

class CustomAuthCheckFailed extends Error {
    constructor() {
        super("Custom auth check failed for provided token");
        this.statusCode = 403;
    }
}

class RefreshTokenInvalidated extends Error {
    constructor() {
        super("Refresh token has already been invalidated, relogin");
        this.statusCode = 403;
    }
}

module.exports = { NoToken, InvalidToken, InvalidAudience, InvalidType, CustomAuthCheckFailed, RefreshTokenInvalidated }