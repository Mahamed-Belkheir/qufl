# Qufl

(arabic: قفل, "Lock") is a JWT authentication library for express-middleware compatible libraries.
Qufl focuses on being simple to use, unopinionated and flexible, it does not assume anything of your project
besides a web framework that is compatible with express middleware. Qufl comes with 0 dependencies.

>**Note:**  Qufl is still in Alpha, and the API might change in the future.

## To Do:

- Add integeration tests with other libraries

- Add E2E test which would double as an example project

- Add redis support for distributed authentication services


## installation:

``` npm i qufl ```

qufl does not include any dependencies, but you will be required to provide a JWT implementation.
[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) was tested to be working, but any other 
implementation satisfying the interface would suffice.

## How to use:

### Initialize Qufl

You need to initialize a qufl instance by passing an option object to the constructor, options include:

- JWT: the jsonwebtoken object or another implementation that satisfies the sign and verify interfaces
- secret: the JWT secret key
- timeout: time before a JWT expires, either a number (seconds) or a string e.g ("1h", "20m")

```js
const Qufl = require('qufl');
const jwt = require('jsonwebtoken');

const qufl = new Qufl({
    JWT: jwt,
    secret: "test",
    timeout: '15m'
});
```

### Sign a Token

The signToken method returns both a token and a refresh token, the latter is added to the token store (currently only in memory).
You pass an options object that contains:

- agent: the user being authorized
- role: user role
- client: optional parameter, allows different session on different clients (e.g: mobile login and logout does not affect web session)
- custom: any custom properties you wish to include to verify by later on

```js
qufl.signToken({
    agent: userId,
    role: "user",
    client: "mobile",
    custom: {
        likesToParty: true
    }
});
```

### refreshToken

The refreshToken method takes a decoded refresh JWT and returns a new JWT,
provided the decoded token is of type refresh and is still in the token store

```js
qufl.refreshToken(decodedRefreshToken);

```

### removeToken

The removeToken method is effecitvely a logout method, it takes a decoded JWT object, 
and removes the associated user and client entry

```js
qufl.removeToken(decodedToken);
```

### changeSecret

Changes the JWT secret and empties the token store

```js
qufl.changeSecret(newSecret);
```

### getValidator

Generates a custom authentication middleware function based on the option object passed in

>**Note:** content likely to change in future versions

- role: the user role allowed to access the route
- type: token type, optional parameter, normal tokens are "token", input "refresh" for refresh token routes
- predicate: a function expected to return a boolean value, it's passed the custom attribute given to the signToken function

The middleware will reject requests for the following:

- no token provided
- invalid token
- invalid role
- invalid type
- custom check failed

```js
qufl.getValidator({
    role: "user",
    type: "token" || "refresh"
    predicate: (custom) => custom.likesToParty
})
```