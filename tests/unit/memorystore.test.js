const storeFactory = require('../../lib/tokenstore');

const store = storeFactory();

let client = ["web", "mobile"]
let tokens = [
    {agent: "bob", client},
    {agent: "Adam", client},
]

test("Store contains nothing", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[0])).toBe(false)
})

test("Store accepts token", () => {
    expect(()=>{
        store.storeToken(tokens[0].agent, tokens[0].client[0])
    }).not.toThrow()
})

test("Stored token exists", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[0])).toBeTruthy()
})

test("Non existent agent not found", () => {
    expect(store.checkToken(tokens[1].agent, tokens[0].client[0])).toBeFalsy()
})

test("wrong agent client not found", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[1])).toBeFalsy()
})

test("Store accepts new client for agent", () => {
    expect(()=>{
        store.storeToken(tokens[0].agent, tokens[0].client[1])
    }).not.toThrow()
})

test("Second client stored token exists", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[1])).toBeTruthy()
})

test("deletes one client without error", () => {
    expect(() => {
        store.deleteToken(tokens[0].agent, tokens[0].client[0])
    }).not.toThrow()
})

test("Second client stored token still exists", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[1])).toBeTruthy()
})

test("first client stored token no longer exists", () => {
    expect(store.checkToken(tokens[0].agent, tokens[0].client[0])).toBeFalsy()
})