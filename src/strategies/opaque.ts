import { StoreFacade } from "../store";
import { randomHash } from "../util";

export class OpaqueTokenNotFound extends Error {
    message: string = "invalid token"
    code: number = 401
}

export class OpaqueStrategy<Identity> {
    constructor(
        private store: StoreFacade,
        private mapToId: (data: any) => Identity = d => d
    ) {
        
    }

    issueToken = async (data: Identity) => {
        let token = randomHash();
        await this.store.set(token, JSON.stringify(data));
        return token;
    }

    authenticateToken = async (token: string) => {
        let id = await this.store.get(token)
        if (!id) throw new OpaqueTokenNotFound
        return this.mapToId(JSON.parse(id));
    }

    invalidateToken = async (token: string) => {
        await this.store.destroy(token);
    }
}