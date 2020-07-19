const Qufl = require('../../lib/qufl');

const JWT = {
    sign(token) {
        return JSON.stringify(token);
    },
    verify(token) {
        return JSON.parse(token);
    }
};

let qufl = new Qufl({ JWT, secret: "testing_secret" });

let credentials = {
    agent: "bob",
    role: "admin",
    custom: {
        likesToParty: true
    }
};

beforeEach(()=>{
    qufl = new Qufl({ JWT, secret: "testing_secret" });
})

test("Qufl is able to sign tokens", () => {
    let {token, refresh} = qufl.signToken(credentials);
    let copy = {...credentials};
    copy.type = "token";
    expect(JSON.parse(token)).toMatchObject(copy);
    copy.type = "refresh";
    expect(JSON.parse(refresh)).toMatchObject(copy);
})

test("Qufl is able to refresh tokens", () => {
    let { token, refresh } = qufl.signToken(credentials);
    qufl.store.checkToken = () => true ;
    refresh = JSON.parse(refresh);
    refresh.type = "refresh";
    let newToken = qufl.refreshToken(refresh);
    expect(JSON.parse(newToken)).toMatchObject(JSON.parse(token));
})

test("Qufl does not refresh removed tokens", () => {
    qufl.store.checkToken = () => false;
    let { refresh } = qufl.signToken(credentials);
    expect(() => {
        qufl.refreshToken(JSON.parse(refresh))
    }).toThrow("Refresh token removed")
})

test("Qufl validator function passes valid tokens", () => {
    let { token } = qufl.signToken(credentials);
    const req = { headers: { authorization: "Bearer " +token} }
    const res = { code: 0, status(code) { this.code = code; return this}, send(data) { throw data }}
    const next = () => { throw "passed on successfully" }
    let validator = qufl.getValidator({
        role: credentials.role,
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow("passed on successfully")
    expect(req.qufl).toMatchObject(JSON.parse(token))
    validator = qufl.getValidator({
        predicate: (token) => token.likesToParty
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow("passed on successfully")
})

test("Qufl validator function rejects invalid tokens", () => {
    let { token } = qufl.signToken(credentials);
    let req = { headers: { authorization: "Bearer 4" +token} }
    let res = { code: 0, status(code) { this.code = code; return this}, send({error}) { throw JSON.stringify({code: this.code, error}) }}
    let next = () => { throw "passed on successfully" }
    
    let validator = qufl.getValidator({
        role: credentials.role,
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow(JSON.stringify({code: 401, error: "Token Invalid"}))

    req.headers.authorization = "";

    validator = qufl.getValidator({
        role: credentials.role,
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow(JSON.stringify({code: 401, error: "No token provided"}))

    req.headers.authorization = "Bearer " + token;

    validator = qufl.getValidator({
        role: "engineer",
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow(JSON.stringify({code: 403, error: "Invalid role"}))

    validator = qufl.getValidator({
        predicate: (token) => !token.likesToParty
    })
    expect(() => {
        validator(req, res, next)
    }).toThrow(JSON.stringify({code: 403, error: "Custom Auth check failed"}))
})
