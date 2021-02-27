# Qufl

(arabic: قفل, "Lock") is a JWT authentication library for express-middleware compatible web frameworks.
Qufl focuses on being simple to use, unopinionated and flexible, it does not assume anything of your project besides a web framework that is compatible with express middleware.

>**Note:**  Qufl is still in Alpha, and the API might change in the future.


## installation:

``` npm i qufl ```

## How to use:

### usage example:

```ts
import Qufl from "qufl";
import express from "express";
import cookieParser from "cookier-parser";
import UserController from "./controllers/user"

let qufl = new Qufl({ secret: "MY_JWT_SECRET_HERE" });


let server = express();

//
server.use(cookieParser());
server.use(express.json());

server.post('/login', async (req, res) => {
    let { username, password } = req.body;
    let user = await UserController.login(username, password);
    let { token, refresh } = qufl.signToken({
        sub: user.id,
        payload: {
            preferences: user.preferences
        }
    });
    res.cookie(qufl.cookieKey(), refresh);
    res.send({
        status: 'success',
        token
    });
})

server.get('/refersh', qufl.auth({ type: "refresh" }), async (req, res) => {
    let token = await qufl.refreshToken(req.qufl);
    res.send({
        status: 'success',
        token
    });
})

server.get('/logout', qufl.auth(), async (req, res) => {
    let token = await qufl.removeToken(req.qufl);
    res.send({
        status: 'success',
        token
    });
})

server.get('/profile', qufl.auth(), async (req, res) => {
    let profile = await UserController.fetchUserProfile(req.qufl.sub);
    res.send({
        status: 'success',
        profile
    });
})

server.post('/user/ban/:id', qufl.auth({ aud: "admin" }), async(req, res) => {
    await UserController.ban(req.params.id);
    res.send({
        status: 'success'
    });
})


```


### Initialize Qufl

You can configure multiple options at initalization, those options include:

- secret: the JWT signing secret, only required field, errors without if none is defined.
- algorithm: the signing algorithm used by jsonwebtoken, defaults to `HS265`
- cookieKey: the cookie key used to look for JWTs in the cookies header
- passError: a boolean, whether to pass authentication errors to an express error handler or to respond to the client directly.
- tokenTimeout: time before JWTs expire and require refreshing, default is 1h, values are passed to `jsonwebtoken`'s expiresIn as is, refer to `vercel/ms` for format
- store: accepts any `express-session` compatible storage class, leave empty to use `memeorystore` by default, which is a production ready in-memory implementation

```ts
import Qufl from "qufl";

//  using default values
let qufl = new Qufl({ secret: "MY_JWT_SECRET_HERE" });

// with a different store implementation and changing defaults
import redis from "redis";
import RedisStore from "connect-redis";
const client = redis.createClient();

qufl = new Qufl({
    algorithm: "HS512",
    cookieKey: "refresh_token",
    passError: true,
    secret: "MY_JWT_SECRET_HERE",
    tokenTimeout: "30m",
    store: RedisStore,
    storeOptions: { client }
});
```

### Sign a Token

The signToken method returns both a token and a refresh token, the token content is identical, with the type of each set accordingly.
You pass an options object that contains:

- sub: the jwt subject, a unique ID, either globally or within the audience
- aud: (optional) the jwt audience, can be used to set different accessibility rules, (e.g user routes, admin routes), subject must be unique within the audience
- payload: (optional) any custom properties you wish to include

```js
await qufl.signToken({
        sub: userId,
        aud: "user",
        payload: {
            likesToParty: true
        }
    });
```

### refreshToken

The refreshToken method takes a decoded refresh JWT and returns a new JWT,
provided the decoded token is of type refresh and the session is still in the token store

```js
let newToken = await qufl.refreshToken(decodedRefreshToken);

```

### removeToken

The removeToken method is effecitvely a logout method, it takes a decoded JWT object, 
and removes the associated session from the store 

```js
await qufl.removeToken(decodedToken);
```

### changeSecret

Changes the JWT secret

```js
await qufl.changeSecret(newSecret);
```

### auth

Generates an authentication middleware based on the option object passed in, the decoded token is stored on the request with the `qufl` attribute. (accessible in routes as `req.qufl`)

all parameters are optional, if none are provided, the default values are used, allowing any request with a valid token to pass through.

- aud: the audience, only JWTs targeting this audience are allowed
- type: token type, optional parameter, defaults to normal "token"s, use "refresh" for refresh token routes
- validator: allows you to implement custom authentication rules in the middleware itself, it's passed the decoded token, and the express request and response objects, you're able to send a response directly in the validator and end the request, or throw an error and let the error handler handle it.
- extractor: allows you to specificy a custom token extractor for this one route, it accepts an express request object and expects a JWT string returned

The middleware will reject requests for the following:

- no token provided
- invalid token
- invalid aud
- invalid type
- custom check failed

If passError is set to `true`, the validator will pass the error into next(e), including an error message and a statusCode

```js
qufl.auth({
    aud: "admin",
    type: "token" || "refresh"
    validator: (token, req, res) => {
        if (token.payload.likesToParty) {
            req.send({
                message: "no fun allowed"
            })
            return false;
        }
        if (token.payload.friends.length > 100) {
            throw Error("user too popular");
        } 
        return true;
    },
    extractor: (req) => req.headers['custom_jwt_header'];
})
```

### Extractors

Extractors are functions that take a request and retrieves the token string, while you can define custom extractors on each auth middleware, Qufl comes with defaults, which you can override.

the `extractors` properties include the default extractor implementations for bearer tokens, cookies, and signed cookies. the `extractorMapping` property holds the default implementation for both token types, the defaults are `bearer` for `token` and `cookie` for `refresh` tokens.

```ts
class Qufl {

    // ...
    public extractors: { [key: string]: TokenExtractor } = {
        bearer: (req: Request) => {
            let header = req.headers['authorization'];
            if (!header) throw new exceptions.NoTokenException();
            return header.slice(7)
        },
        cookie: (req: Request) => {
            return req.cookies[this.options.cookieKey];
        },
        secureCookie: (req: Request) => {
            return req.signedCookies[this.options.cookieKey];
        }
    }

    public extractorMapping: { [key: string]: TokenExtractor } = {
        [Token]: this.extractors.bearer,
        [Refresh]: this.extractors.cookie
    }
    //...
}
```

The default implementation caters to the idea that refresh tokens are stores in httpOnly cookies, while normal tokens are stored in memory, but that can be easily overriden with the following:

```ts
// to use bearer tokens for refresh tokens as well
qufl.extractorMapping["refresh"] = qufl.extractors.bearer

// to define a custom extracting function
qufl.extractorMapping["token"] = (req: Request) => {
    // ...
}
```