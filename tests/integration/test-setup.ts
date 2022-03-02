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

    test("can not access guarded content with different audience", async () => {
        let response = await req.get('/admin/content')
        .set("authorization", "Bearer " + token);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("invalid token audience")
    })

    test("can logout", async () => {
        let response = await req.post('/logout')
        .set("authorization", "Bearer " + token);

        expect(response.status).toBe(200);
    })

    test("can not refresh token after logout", async () => {
        let response = await req.post('/refresh')
        .set("Cookie", cookie);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("refresh token expired");
    })

    test("can login with a different audience", async () => {
        let response = await req.post('/admin/login')
        .send(credentials);

        expect(typeof response.body.token).toBe("string");
        expect(typeof response.header['set-cookie'][0]).toBe("string");
        
        token = response.body.token;
        cookie = response.header['set-cookie'];
    })

    test("can refresh token", async () => {
        let response = await req.post('/admin/refresh')
        .set("Cookie", cookie);
        
        expect(response.status).toBe(200);
        expect(typeof response.body.token).toBe("string");
        
        token = response.body.token;
    })

    test("can access gaurded content", async () => {
        let response = await req.get('/admin/content')
        .set("authorization", "Bearer " + token);

        expect(response.status).toBe(200);
    })

    test("can logout", async () => {
        let response = await req.post('/admin/logout')
        .set("authorization", "Bearer " + token);

        expect(response.status).toBe(200);
    })

    test("can not refresh token after logout", async () => {
        let response = await req.post('/admin/refresh')
        .set("Cookie", cookie);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("refresh token expired");
    })

    test("user can access mixed access route and register qufl data", async () => {
        let response = await req.get('/mixed')
        .set("authorization", "Bearer " + token);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(credentials.id);
    })

    test("unauthenticated users can access the route but have no qufl data", async () => {
        let response = await req.get('/mixed')
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(undefined);
    })
}