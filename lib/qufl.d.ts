/// <reference types="node" />
import { NextFunction, Request, Response } from "express";
import * as exceptions from "./exceptions";
import { StoreInterface } from "./store";
import EventEmitter from "events";
export default class Qufl {
    private options;
    private store;
    constructor({ algorithm, cookieKey, passError, secret, tokenTimeout, store, storeOptions, }?: {
        algorithm?: string | undefined;
        cookieKey?: string | undefined;
        passError?: boolean | undefined;
        secret?: string | undefined;
        tokenTimeout?: string | undefined;
        store?: undefined;
        storeOptions?: {} | undefined;
    });
    cookieKey(): string;
    signToken(data: Omit<QuflToken, "type">): Promise<{
        token: string;
        refresh: string;
    }>;
    refreshToken(refreshToken: QuflToken): Promise<string>;
    removeToken(token: QuflToken): Promise<void>;
    private verifyToken;
    private errorResponse;
    extractors: {
        [key: string]: TokenExtractor;
    };
    extractorMapping: {
        [key: string]: TokenExtractor;
    };
    auth: (options?: AuthOptions) => (req: Request, res: Response, next: NextFunction) => void;
    changeSecret(secret: string): void;
}
export declare type QuflToken = {
    sub: string;
    aud?: string;
    type: TokenType;
    payload?: {
        [key: string]: any;
    };
};
declare type TokenType = "token" | "refresh";
export declare type AuthOptions = {
    aud?: string;
    type?: TokenType;
    validator?: (token: QuflToken, req: Request, res: Response) => Promise<boolean | void>;
    extractor?: TokenExtractor;
};
export declare type QuflOptions = {
    tokenTimeout: number | string;
    secret: string;
    cookieKey: string;
    algorithm: string;
    passError: boolean;
    store?: (events: typeof EventEmitter) => StoreInterface;
    storeOptions?: any;
};
export declare type TokenExtractor = (req: Request) => string;
declare global {
    namespace Express {
        interface Request {
            qufl: QuflToken;
        }
    }
}
export declare const Exceptions: typeof exceptions;
export {};
