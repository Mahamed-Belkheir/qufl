import { StoreFacade } from "../store";
export declare class JWTAccessTokenInvalid extends Error {
    message: string;
    code: number;
}
export declare class JWTRefreshTokenInvalid extends Error {
    message: string;
    code: number;
}
export declare class JWTStrategy<Identity> {
    private store;
    private options;
    private mapToId;
    constructor(store?: StoreFacade, options?: {
        secret: string;
        algoritm: string;
        expireIn: string;
        publicKey?: string;
        touch: boolean;
        serializer: (data: any) => string;
    }, mapToId?: (data: any) => Identity);
    issueToken: (data: Identity) => Promise<string[]>;
    authenticateToken: (token: string) => Promise<Identity>;
    refreshToken: (token: string) => Promise<string>;
    issueTokenWithoutRefresh: (data: Identity) => Promise<string>;
    authenticateRefresh: (token: string) => Promise<[Identity, string]>;
    invalidateRefresh: (token: string) => Promise<void>;
}
