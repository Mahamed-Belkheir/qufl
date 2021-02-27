export declare abstract class QuflBaseException extends Error {
    statusCode: number;
}
export declare class NoTokenException extends QuflBaseException {
    constructor();
}
export declare class InvalidTokenException extends QuflBaseException {
    constructor();
}
export declare class InvalidAudienceException extends QuflBaseException {
    constructor();
}
export declare class InvalidTokenTypeException extends QuflBaseException {
    constructor();
}
export declare class RefreshTokenExpiredException extends QuflBaseException {
    constructor();
}
export declare class SessionStoreUnavailableException extends QuflBaseException {
    constructor();
}
