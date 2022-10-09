import { StoreFacade } from "../../src/store";
import { JWTAccessTokenInvalid, JWTRefreshTokenInvalid, JWTStrategy } from "../../src/strategies/jwt";

describe("unit test - jwt strategy", () => {

    let user = { id: 1, name: "bob" };

    let strategy = new JWTStrategy<typeof user>(
        new StoreFacade()
    );

    let access = "";
    let refresh = "";

    it("does not authenticate invalid access tokens", async () => {
        let didThrow = false;
        try {
            await strategy.authenticateToken("invalid random token")
        } catch(e) {
            didThrow = true;
            expect(e).toBeInstanceOf(JWTAccessTokenInvalid);
        }
        expect(didThrow).toBeTruthy()
    })

    it("does not refresh with invalid refresh tokens", async () => {
        let didThrow = false;
        try {
            await strategy.refreshToken("invalid random token")
        } catch(e) {
            didThrow = true;
            expect(e).toBeInstanceOf(JWTRefreshTokenInvalid);
        }
        expect(didThrow).toBeTruthy()
    })

    it("can generate access and refresh tokens", async () => {
        [access, refresh] = await strategy.issueToken(user);
        expect(access.length).not.toBe(0);
        expect(refresh.length).not.toBe(0);        
    })

    it("can authenticate with access tokens", async () => {
        let authenticatedUser = await strategy.authenticateToken(access);
        expect(authenticatedUser).toMatchObject(user);
    })

    it("can generate new access tokens with refresh tokens", async () => {
        access = await strategy.refreshToken(refresh);
        expect(access.length).not.toBe(0);
    })

    it("can authenticate with refreshed tokens", async () => {
        let authenticatedUser = await strategy.authenticateToken(access);
        expect(authenticatedUser).toMatchObject(user);
    })

    it("can invalidate refresh tokens", async () => {
        await strategy.invalidateRefresh(refresh);
    })

    it ("can no longer use refresh tokens after invalidating", async () => {
        let didThrow = false;
        try {
            await strategy.refreshToken(refresh)
        } catch(e) {
            didThrow = true;
            expect(e).toBeInstanceOf(JWTRefreshTokenInvalid);
        }
        expect(didThrow).toBeTruthy()
    })
})