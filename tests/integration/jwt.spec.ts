import ExpressJWTServer from "./express/express.jwt.setup";
import ExpressJWTTests from "./strategies/jwt.cases";

describe("JWT Test", () => {
    describe("express", () => {
        ExpressJWTTests(ExpressJWTServer())
    })
})