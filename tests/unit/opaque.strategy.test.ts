import { StoreFacade } from "../../src/store";
import { OpaqueStrategy, OpaqueTokenNotFound } from "../../src/strategies/opaque";

describe("unit test - opaque strategy", () => {
    
    let user = { id: 1, name: "bob" };

    let strategy = new OpaqueStrategy<typeof user>(
        new StoreFacade()
    );

    let token: string | undefined = undefined;

    it ('cant authenticate with invalid tokens', async () => {
        let didThrow = false;
        try {
            await strategy.authenticateToken("randomTOkenTHatDoesn'tExist");
        } catch (e) {
            didThrow = true;
            expect(e).toBeInstanceOf(OpaqueTokenNotFound);
        }
        expect(didThrow).toBeTruthy();
    })

    it("can generate tokens", async () => {
        token = await strategy.issueToken(user);
        expect(typeof token).toBe("string");
    })

    it("can authenticate with valid tokens", async () => {
        let authenticatedUser = await strategy.authenticateToken(token!);
        expect(authenticatedUser).toMatchObject(user);
    })

    it("can invalidate tokens", async () => {
        await strategy.invalidateToken(token!)
    })

    it("can't authenticate after invalidating tokens", async () => {
        let didThrow = false;
        try {
            await strategy.authenticateToken(token!);
        } catch (e) {
            didThrow = true;
            expect(e).toBeInstanceOf(OpaqueTokenNotFound);
        }
        expect(didThrow).toBeTruthy();
    })
})