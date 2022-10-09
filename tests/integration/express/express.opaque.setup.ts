import express from "express";
import cookieParser from "cookie-parser";
import { COOKIE_KEY, OpaqueAccess, OpaqueAdminOnly, OpaqueAuth, OpaqueLoggedOpenEntry } from "../strategies/auth";



let accessAuth = OpaqueAccess.toExpressMiddleware()
let adminAuth = OpaqueAdminOnly.toExpressMiddleware().bearerExtractor().build()

export default () => {
    let server = express();
    server.use(express.json());
    server.use(cookieParser());
    server.post('/login', async (req, res) => {
        let data = req.body;

        let token = await OpaqueAuth.issueToken({
            ...data
        })
        res.send(token);
    })

    server.post('/admin/login', async (req, res) => {
        let data = req.body;
        let token = await OpaqueAuth.issueToken({
            ...data
        })
        res.send(token);
    })


    server.get('/logout', accessAuth.bearerExtractor().build(), async (req, res) => {
        let token = OpaqueAccess.getToken(req);
        await OpaqueAuth.invalidateToken(token);
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


    server.get('/public', OpaqueLoggedOpenEntry.toExpressMiddleware().bearerExtractor().build(), async (req, res) => {
        let user = OpaqueAccess.getId(req) 
        res.status(200).send({id: user?.id});
    })


    //@ts-ignore
    server.use((e, _, res, _2) => {
        let code = e.code || 500 
        let message = e.message || "internal server error";
        res.status(code).send(message)
    })


    return server;
}
