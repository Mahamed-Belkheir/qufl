import { AuthBuilder } from "../../src/authbuilder";

describe("unit test - auth builder", () => {

    it("can construct multiple auth builders", async () => {
        let invokeCount = 0;
        let user = { name: "bob", age: 20 };
        let baseAuth = new AuthBuilder<typeof user>((data) => {
            invokeCount++;
            return JSON.parse(data);
        });

        let first = baseAuth.build();
        let second = baseAuth.clone().build();
        let token = JSON.stringify(user);

        let firstResult = await first(token);
        expect(firstResult).toMatchObject(user);
        expect(invokeCount).toBe(1);
        let secondResult = await second(token);
        expect(secondResult).toMatchObject(user);
        expect(invokeCount).toBe(2);
    })

    it("can chain middleware and activate it", async () => {
        let firstMiddlewareCount = 0;
        let secondMiddlewareCount = 0;
        let user = { name: "bob", age: 20 };
        let baseAuth = new AuthBuilder<{ user: string, age: number }>((data) => {
            return JSON.parse(data);
        })
        .middleware(u => {firstMiddlewareCount++; return u;})
        .middleware(u => {secondMiddlewareCount++; return u;})
        .middleware(u => {secondMiddlewareCount++; return u;})
        .build()

        let token = JSON.stringify(user);

        await baseAuth(token)

        expect(firstMiddlewareCount).toBe(1);
        expect(secondMiddlewareCount).toBe(2);

        await baseAuth(token)

        expect(firstMiddlewareCount).toBe(2);
        expect(secondMiddlewareCount).toBe(4);

    })

    it("cloned auth builders do not mutate originals", async () => {
        let sharedMiddlewareCount = 0;
        let firstMiddlewareCount = 0;
        let secondMiddlewareCount = 0;
        let user = { name: "bob", age: 20 };
        let base = new AuthBuilder<{ user: string, age: number }>((data) => {
            return JSON.parse(data);
        }).middleware((u) => {sharedMiddlewareCount++; return u;})

        let first = base.middleware(u => { firstMiddlewareCount++; return u; }).build()
        let second = base.middleware(u => { secondMiddlewareCount++; return u; }).build()

        let token = JSON.stringify(user);

        await first(token);
        expect(sharedMiddlewareCount).toBe(1);
        expect(firstMiddlewareCount).toBe(1);
        expect(secondMiddlewareCount).toBe(0);

        await second(token);
        expect(sharedMiddlewareCount).toBe(2);
        expect(firstMiddlewareCount).toBe(1);
        expect(secondMiddlewareCount).toBe(1);

        await second(token);
        expect(sharedMiddlewareCount).toBe(3);
        expect(firstMiddlewareCount).toBe(1);
        expect(secondMiddlewareCount).toBe(2);
    })

    describe("extractors and router middleware", () => {
        describe("request based extractors", () => {
            it("can extract from cookies", async () => {
                let user = { name: "bob", age: 20 };
                let nextCalled = false;
                let auth = new AuthBuilder<typeof user>(JSON.parse)
                    .toExpressMiddleware()
                    .cookieExtractor("cookie_key")
                    

                let request = {
                    cookies: {
                        cookie_key: JSON.stringify(user)
                    }
                }

                await (auth.build()(request, {}, (e: Error) => {
                    expect(e).toBeUndefined()
                    nextCalled = true;
                }))

                expect(auth.getId(request)).toMatchObject(user)
                expect(nextCalled).toBeTruthy()
            })

            it("can extract from headers", async () => {
                let user = { name: "bob", age: 20 };
                let nextCalled = false;
                let auth = new AuthBuilder<typeof user>(JSON.parse)
                    .toExpressMiddleware()
                    .headerExtractor("AUTH-X")

                let request = {
                    headers: {
                        "AUTH-X": JSON.stringify(user)
                    }
                }

                await (auth.build()(request, {}, (e: Error) => {
                    expect(e).toBeUndefined()
                    nextCalled = true;
                }))

                expect(auth.getId(request)).toMatchObject(user)
                expect(nextCalled).toBeTruthy()
            })

            it("can extract from bearer header", async () => {
                let user = { name: "bob", age: 20 };
                let nextCalled = false;
                let auth = new AuthBuilder<typeof user>(JSON.parse)
                    .toExpressMiddleware()
                    .bearerExtractor()

                let request = {
                    headers: {
                        authorization: "Bearer " + JSON.stringify(user)
                    }
                }

                await (auth.build()(request, {}, (e: Error) => {
                    expect(e).toBeUndefined()
                    nextCalled = true;
                }))

                expect(auth.getId(request)).toMatchObject(user)
                expect(nextCalled).toBeTruthy()
            })
        })

        describe("context based extractors", () => {
            it("can extract from cookies", async () => {
                let user = { name: "bob", age: 20 };
                let nextCalled = false;
                let auth = new AuthBuilder<typeof user>(JSON.parse)
                    .toKoaMiddleware()
                    .cookieExtractor("cookie_key")


                let cookies: Record<string, string> = {
                    cookie_key: JSON.stringify(user)
                }
                let context = {
                    cookies: {
                        get(key: string) {
                          return cookies[key]  
                        }
                    },
                    qufl: undefined
                }

                await (auth.build()(context, (e: Error) => {
                    expect(e).toBeUndefined()
                    nextCalled = true;
                }))

                expect(auth.getId(context)).toMatchObject(user)
                expect(nextCalled).toBeTruthy()
            })
        })

        it("can use custom extractors", async () => {
            let user = { name: "bob", age: 20 };
            let nextCalled = false;
            let auth = new AuthBuilder<typeof user>(JSON.parse)
                .toExpressMiddleware()
                .customExtractor((req: any) => {
                    return req.someField
                })

            let request = {
                someField: JSON.stringify(user),
            }

            
            await (auth.build()(request, null, (e: Error) => {
                expect(e).toBeUndefined()
                nextCalled = true;
            }))

            expect(auth.getId(request)).toMatchObject(user)
            expect(nextCalled).toBeTruthy()
        })
    })
})