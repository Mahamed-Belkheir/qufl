import supertest from "supertest";
import { COOKIE_KEY } from "./auth";

export default function OpaqueTestSetup(server: any) {
    let app = supertest(server);

    let adminCredentials = {
        id: "1",
        name: "admin1",
        role: "admin"
    }

    let adminToken = "";

    let userCredentials = {
        id: "2",
        name: "user1",
        role: "user"
    }

    let userToken = ""

    describe("user", () => {
        test("can login", async () => {
            let res = await app.post('/login')
            .send(userCredentials)

            expect(typeof res.text).toBe("string")
            userToken = res.text;
        })
    
        describe("can access guarded content", () => {
            test("via auth headers", async () => {
                let res = await app.get('/content/headers')
                .set("authheader-x", userToken)

                expect(res.status).toBe(200);
            })

            test("via cookies", async () => {
                let res = await app.get('/content/cookies')
                .set("Cookie", [COOKIE_KEY+'='+userToken])

                expect(res.status).toBe(200);
            })

            test("via bearer token", async () => {
                let res = await app.get('/content/bearer')
                .set("authorization", "Bearer "+userToken)

                expect(res.status).toBe(200);
            })

            test("via custom extractor", async () => {
                let res = await app.get('/content/custom')
                .send({
                    access_token: JSON.stringify({ token: userToken })
                })

                expect(res.status).toBe(200);
            })
        })

        test("cant access out of scope content", async () => {
            let res = await app.get('/admin')
            .set("authorization", "Bearer "+userToken)

            expect(res.status).toBe(403);
        })

        test("can access public scope content", async () => {
            let res = await app.get('/public')
            .set("authorization", "Bearer "+userToken)

            expect(res.status).toBe(200);
        })

        test("can log out", async () => {
            let res = await app.get('/logout')
            .set("authorization", "Bearer "+userToken)

            expect(res.status).toBe(200);
        })

        test("cant access guarded content after log out", async () => {
            let res = await app.get('/content/bearer')
            .set("authorization", "Bearer "+userToken)

            expect(res.status).toBe(401);
        })
    })

    describe("admin", () => {
        test("can login", async () => {
            let res = await app.post('/login')
            .send(adminCredentials)

            expect(typeof res.text).toBe("string")
            adminToken = res.text;
        })
    
        test("can access guarded content", async () => {
            let res = await app.get('/content/bearer')
            .set("authorization", "Bearer "+adminToken)

            expect(res.status).toBe(200);
        })

        test("can access scoped content", async () => {
            let res = await app.get('/admin')
            .set("authorization", "Bearer "+adminToken)

            expect(res.status).toBe(200);
        })

        test("can access public scope content", async () => {
            let res = await app.get('/public')
            .set("authorization", "Bearer "+adminToken)

            expect(res.status).toBe(200);
        })

        test("can log out", async () => {
            let res = await app.get('/logout')
            .set("authorization", "Bearer "+adminToken)

            expect(res.status).toBe(200);
        })

        test("cant access guarded content after log out", async () => {
            let res = await app.get('/admin')
            .set("authorization", "Bearer "+adminToken)

            expect(res.status).toBe(401);
        })
        
    })

    describe("guest", () => {

        test("can access public scope content", async () => {
            let res = await app.get('/public')

            expect(res.status).toBe(200);
        })

        test("cant access guarded content", async () => {
            let res = await app.get('/content/bearer')

            expect(res.status).toBe(401);
        })
        
    })

}