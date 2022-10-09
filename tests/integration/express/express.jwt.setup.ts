import express from "express";
import cookieParser from "cookie-parser";
import { COOKIE_KEY, JWTAccess, JWTAdminOnly, JWTAuth, JWTRefresh } from "../strategies/auth";



let refreshAuth = JWTRefresh.toExpressMiddleware().cookieExtractor(COOKIE_KEY).build()
let accessAuth = JWTAccess.toExpressMiddleware()
let adminAuth = JWTAdminOnly.toExpressMiddleware().bearerExtractor().build()

export default () => {
    let server = express();
    server.use(express.json());
    server.use(cookieParser());
    server.post('/login', async (req, res) => {
        let data = req.body;

        let [token, refresh] = await JWTAuth.issueToken({
            ...data
        })
        res.cookie(COOKIE_KEY, refresh);
        res.send(token);
    })

    server.post('/admin/login', async (req, res) => {
        let data = req.body;
        let [token, refresh] = await JWTAuth.issueToken({
            ...data
        })
        res.cookie(COOKIE_KEY, refresh);
        res.send(token);
    })

    server.get('/refresh', refreshAuth, async (req, res) => {
        try {
            let token = JWTRefresh.getToken(req);
            var newAccesstoken = await JWTAuth.refreshToken(token);
        } catch (err) {
            let code = err.statusCode || 500;
            res.status(code).send({message: err.message})
            return;
        }
        res.send(newAccesstoken);
    })


    server.get('/logout', refreshAuth, async (req, res) => {
        let token = JWTRefresh.getToken(req);
        await JWTAuth.invalidateRefresh(token);
        res.sendStatus(200);
    })

    server.get('/public', async (_, res) => {
        res.sendStatus(200);
    })

    server.get('/content/headers', accessAuth.headerExtractor('authheader-x').build(), async (_, res) => {
        res.sendStatus(200);
    })

    server.get('/content/bearer', accessAuth.bearerExtractor().build(), async (_, res) => {
        res.sendStatus(200);
    })

    server.get('/content/cookies', accessAuth.cookieExtractor(COOKIE_KEY).build(), async (_, res) => {
        res.sendStatus(200);
    })

    server.get('/content/custom', accessAuth.customExtractor((req) => {
        return JSON.parse(req.body.access_token).token
    }).build(), async (_, res) => {
        res.sendStatus(200);
    })

    server.get('/admin', adminAuth, async (_, res) => {
        res.sendStatus(200);
    })

    //@ts-ignore
    server.use((e, _, res, _2) => {
        let code = e.code || 500 
        let message = e.message || "internal server error";
        res.status(code).send(message)
    })

    return server;
}
