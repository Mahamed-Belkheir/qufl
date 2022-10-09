import supertest from "supertest";
import { COOKIE_KEY } from "./auth";

export default function JWTTestSetup(server: any) {
    let app = supertest(server);

    let userCredentials = {
        id: "2",
        name: "user1",
        role: "user"
    }

    let userToken = ""
    let refresh: string[] = []

    describe("user", () => {
        test("can login", async () => {
            let res = await app.post('/login')
            .send(userCredentials)

            expect(typeof res.text).toBe("string")
            expect(typeof res.header['set-cookie'][0]).toBe("string");
            userToken = res.text
            refresh = res.header['set-cookie']
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

        test("can refresh token", async () => {
            let res = await app.get('/refresh')
            .set("Cookie", refresh)

            expect(res.status).toBe(200);
            expect(typeof res.text).toBe('string')
        })

        test("can log out", async () => {
            let res = await app.get('/logout')
            .set("Cookie", refresh)

            expect(res.status).toBe(200);
        })

        test("cant refresh after log out", async () => {
            let res = await app.get('/refresh')
            .set("Cookie", refresh)

            expect(res.status).toBe(401);
        })
    })
}