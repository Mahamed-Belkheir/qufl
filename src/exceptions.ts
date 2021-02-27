export abstract class QuflBaseException extends Error {
    statusCode: number = 401;
}

export class NoTokenException extends QuflBaseException {
    constructor() {
        super("no token provided");
    }
}

export class InvalidTokenException extends QuflBaseException {
    constructor() {
        super("token provided is invalid");
    }
}

export class InvalidAudienceException extends QuflBaseException {
    constructor() {
        super("invalid token audience");
        this.statusCode = 403;
    }
}

export class InvalidTokenTypeException extends QuflBaseException {
    constructor() {
        super("invalid token type");
    }
}

export class RefreshTokenExpiredException extends QuflBaseException {
    constructor() {
        super("refresh token expired")
    }
}

export class SessionStoreUnavailableException extends QuflBaseException {
    
    constructor() {
        super("sessions store unavailable");
        this.statusCode = 500;
    }
}