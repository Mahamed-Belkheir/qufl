import { Express } from "express";
import supertest from "supertest";

export default (server: Express) => () => {
    let req = supertest(server);
    let credentials = {
        id: 1,
        username: "bob"
    }
    let token = "";
    let cookie: string[] = [];

    test("can login", async () => {
        let response = await req.post('/login')
        .send(credentials);
        expect(typeof response.body.token).toBe("string");
        expect(typeof response.header['set-cookie'][0]).toBe("string");
        token = response.body.token;
        cookie = response.header['set-cookie'];
    })

    test("can refresh token", async () => {
        let response = await req.post('/refresh')
        .set("Cookie", cookie);
        expect(response.status).toBe(200);
        expect(typeof response.body.token).toBe("string");
        token = response.body.token;
    })

    test("can access gaurded content", async () => {
        let response = await req.get('/content')
        .set("authorization", "Bearer " + token);

        expect(response.status).toBe(200);
    })
}