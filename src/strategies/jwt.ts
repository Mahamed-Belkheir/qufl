import jwt from "jsonwebtoken";

import { StoreFacade } from "../store";
import { randomHash } from "../util";

export class JWTAccessTokenInvalid extends Error {
    message: string = "invalid access token";
    code: number = 401
}

export class JWTRefreshTokenInvalid extends Error {
    message: string = "invalid refresh token";
    code: number = 401
}


export class JWTStrategy<Identity> {
    constructor(
        private store: StoreFacade = new StoreFacade(),
        private options: { 
            secret: string,
            algoritm: string,
            expireIn: string,
            publicKey?: string,
        } = { 
            secret: randomHash(),
            algoritm: "HS256",
            expireIn: "10m"
         },
        private mapToId: (data: any) => Identity = d => d
    ) {
        
    }

    issueToken = async (data: Identity) => {
        let refresh = randomHash();
        let token = await this.issueTokenWithoutRefresh(data);
        await this.store.set(refresh, JSON.stringify(data));
        return [ token, refresh ];
    }

    authenticateToken = async (token: string) => {
        try {
            const secret = this.options.publicKey || this.options.secret
            let { data } = jwt.verify(token, secret, { 
                algorithms: this.options.algoritm as any,
            }) as any
            return this.mapToId(data);
        } catch {
            throw new JWTAccessTokenInvalid()
        }
    }

    refreshToken = async (token: string) => {
        let data = await this.store.get(token)
        if (!data) throw new JWTRefreshTokenInvalid()
        data = JSON.parse(data);
        return jwt.sign({
            data, 
        }, this.options.secret, { 
            algorithm: this.options.algoritm as any,
            expiresIn: this.options.expireIn,
        })
    }

    issueTokenWithoutRefresh = async (data: Identity) => {
        let token = jwt.sign({
            data, 
        }, this.options.secret, { 
            algorithm: this.options.algoritm as any,
            expiresIn: this.options.expireIn,
        })
        return token;
    }
    
    authenticateRefresh = async (token: string) => {
        let data = await this.store.get(token);
        if (!data) throw new JWTRefreshTokenInvalid();
        data = JSON.parse(data);
        data = this.mapToId(data)
        return [data, token] as [Identity, string];
    }

    invalidateRefresh = async (token: string) => {
        await this.store.destroy(token);
    }
}