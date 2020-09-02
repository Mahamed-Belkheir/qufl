const Qufl = require('../../lib/qufl');
const { NoToken, InvalidToken, InvalidAudience, InvalidType, CustomAuthCheckFailed, RefreshTokenInvalidated } = require('../../lib/exceptions')

const jwt = {
    sign(token) {
        return JSON.stringify(token);
    },
    verify(token) {
        return JSON.parse(token);
    }
};

let qufl = new Qufl({ jwt, secret: "testing_secret", useMiddleware: true });

let credentials = {
    sub: "bob",
    aud: "admin",
    likesToParty: true
};

beforeEach(()=>{
    qufl = new Qufl({ jwt, secret: "testing_secret", useMiddleware: true });
})

test("Qufl is able to sign tokens", async () => {
    let {token, refresh} = await qufl.signToken(credentials);
    let copy = {...credentials};
    copy.type = "token";
    expect(JSON.parse(token)).toMatchObject(copy);
    copy.type = "refresh";
    expect(JSON.parse(refresh)).toMatchObject(copy);
})

test("Qufl is able to refresh tokens", async () => {
    let { token, refresh } = await qufl.signToken(credentials);
    qufl.store.checkToken = () => true ;
    refresh = JSON.parse(refresh);
    refresh.type = "refresh";
    let newToken = await qufl.refreshToken(refresh);
    expect(JSON.parse(newToken)).toMatchObject(JSON.parse(token));
})

test("Qufl does not refresh removed tokens", async () => {
    qufl.store.checkToken = () => false;
    let { refresh } = await qufl.signToken(credentials);
    
    qufl.refreshToken(JSON.parse(refresh))
    .catch(e => expect(e).toBeInstanceOf(RefreshTokenInvalidated))
})

test("Qufl validator function passes valid tokens", async () => {
    let { token } = await qufl.signToken(credentials);
    const req = { headers: { authorization: "Bearer " +token} }
    const res = { code: 0, status(code) { this.code = code; return this}, send(data) { throw data }}
    const next = (e) => { throw (e || "passed on successfully") }
    
    let validator = qufl.getValidator({
        aud: credentials.aud,
    })
    
    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch(e) {
        expect(e).toBe("passed on successfully")
        expect(req.qufl).toMatchObject(JSON.parse(token))
    }
    validator = qufl.getValidator({
        aud: credentials.aud,
        predicate: (token) => token.likesToParty
    })
    
    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch(e) {
        expect(e).toBe("passed on successfully")
    }
})

test("Qufl validator function rejects invalid tokens", async () => {
    let { token } = await qufl.signToken(credentials);
    let req = { headers: { authorization: "Bearer 4" +token} }
    let res = { code: 0, status(code) { this.code = code; return this}, send({error}) { throw "Tried to send" }}
    let next = (e) => { throw e || "did not get an error" }
    
    let validator = qufl.getValidator({
        aud: credentials.aud,
    })
    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch (e) {
        expect(e).toBeInstanceOf(InvalidToken)
    }

    req.headers.authorization = "";

    validator = qufl.getValidator({
        aud: credentials.aud,
    })
    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch(e) {
        expect(e).toBeInstanceOf(NoToken)
    }
    
    req.headers.authorization = "Bearer " + token;

    validator = qufl.getValidator({
        aud: "engineer",
    })

    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch(e) {
        expect(e).toBeInstanceOf(InvalidAudience)
    }
    
    validator = qufl.getValidator({
        aud: credentials.aud,
        predicate: (token) => !token.likesToParty
    })

    try {
        await validator(req, res, next)
        throw "did not invoke next"
    } catch(e) {
        expect(e).toBeInstanceOf(CustomAuthCheckFailed)
    }
})
