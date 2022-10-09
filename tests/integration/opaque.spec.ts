import ExpressOpaqueServer from "./express/express.opaque.setup";
import ExpressOpaqueTests from "./strategies/opaque.cases";

describe("Opaque Test", () => {
    describe("express", () => {
        ExpressOpaqueTests(ExpressOpaqueServer())
    })
})