"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStoreUnavailableException = exports.RefreshTokenExpiredException = exports.InvalidTokenTypeException = exports.InvalidAudienceException = exports.InvalidTokenException = exports.NoTokenException = exports.QuflBaseException = void 0;
class QuflBaseException extends Error {
    constructor() {
        super(...arguments);
        this.statusCode = 401;
    }
}
exports.QuflBaseException = QuflBaseException;
class NoTokenException extends QuflBaseException {
    constructor() {
        super("no token provided");
    }
}
exports.NoTokenException = NoTokenException;
class InvalidTokenException extends QuflBaseException {
    constructor() {
        super("token provided is invalid");
    }
}
exports.InvalidTokenException = InvalidTokenException;
class InvalidAudienceException extends QuflBaseException {
    constructor() {
        super("invalid token audience");
        this.statusCode = 403;
    }
}
exports.InvalidAudienceException = InvalidAudienceException;
class InvalidTokenTypeException extends QuflBaseException {
    constructor() {
        super("invalid token type");
    }
}
exports.InvalidTokenTypeException = InvalidTokenTypeException;
class RefreshTokenExpiredException extends QuflBaseException {
    constructor() {
        super("refresh token expired");
    }
}
exports.RefreshTokenExpiredException = RefreshTokenExpiredException;
class SessionStoreUnavailableException extends QuflBaseException {
    constructor() {
        super("sessions store unavailable");
        this.statusCode = 500;
    }
}
exports.SessionStoreUnavailableException = SessionStoreUnavailableException;
//# sourceMappingURL=exceptions.js.map