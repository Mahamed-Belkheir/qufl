import * as Qufl from "../../../src";
import { StoreFacade } from "../../../src/store";

type User = {
    id: string,
    name: string,
    role: string,
}

class Forbidden extends Error {
    code = 403
}

export let JWTAuth = new Qufl.JWTStrategy<User>(
    new StoreFacade()
)

export let JWTAccess = new Qufl.AuthBuilder(
    JWTAuth.authenticateToken
);

export let JWTRefresh = new Qufl.AuthBuilder(
    JWTAuth.authenticateRefresh
)

export let JWTAdminOnly = JWTAccess.middleware(u => {
    if (u.role != "admin") {
        throw new Forbidden("not an admin");
    }
    return u;
})




export let OpaqueAuth = new Qufl.OpaqueStrategy<User>(new StoreFacade);

export let OpaqueAccess = new Qufl.AuthBuilder(
    OpaqueAuth.authenticateToken
)

export let OpaqueAdminOnly = OpaqueAccess.middleware(u => {
    if (u.role !== "admin") {
        throw new Forbidden("not an admin");
    }
    return u;
})


let count = 0;
export let OpaqueOpenEntry = OpaqueAccess.notRequired().middleware(u => {
    if (!u) {
        u = {
            id: String(++count),
            name: "guest " + count,
            role: "guest" 
        }
    }
    return u;
});


let logs: {id: string, entry: number}[] = [];

export let OpaqueLoggedOpenEntry = OpaqueOpenEntry.middleware(u => {
    logs.push({
        id: u.id,
        entry: Date.now()
    })
    return u;
})


export const COOKIE_KEY="REFRESH_COOKIE"