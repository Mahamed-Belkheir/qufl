import express from "express";
import Qufl from "../../src/qufl";
import cookieParser from "cookie-parser";

export default (qufl: Qufl) => {
    let server = express();
    server.use(express.json());
    //@ts-ignore
    server.use(cookieParser());
    server.post('/login', async (req, res) => {
        let data = req.body;
        let {token, refresh} = await qufl.signToken({
            sub: data.id,
            payload: { username: data.username }
        })
        res.cookie(qufl.cookieKey(), refresh);
        res.send({token});
    })

    server.post('/admin/login', async (req, res) => {
        let data = req.body;
        let {token, refresh} = await qufl.signToken({
            sub: data.id,
            aud: "admin",
            payload: { username: data.username }
        })
        res.cookie(qufl.cookieKey(), refresh);
        res.send({token});
    })

    server.post('/refresh', qufl.auth({ tokenType: "refresh" }), async (req, res) => {
        try {
            var token = await qufl.refreshToken(req.qufl);
        } catch (err) {
            let code = err.statusCode || 500;
            res.status(code).send({message: err.message})
            return;
        }
        res.send({token});
    })

    server.post('/admin/refresh', qufl.auth({ tokenType: "refresh", audience: "admin" }), async (req, res) => {
        try {
            var token = await qufl.refreshToken(req.qufl);
        } catch (err) {
            let code = err.statusCode || 500;
            res.status(code).send({message: err.message})
            return;
        }
        res.send({token});
    })

    server.post('/logout', qufl.auth(), async (req, res) => {
        await qufl.removeToken(req.qufl);
        res.send(200);
    })

    server.post('/admin/logout', qufl.auth({ audience: "admin" }), async (req, res) => {
        await qufl.removeToken(req.qufl);
        res.send(200);
    })

    //@ts-ignore
    server.get('/content', qufl.auth(), async (req, res) => {
        res.send(200);
    })

    //@ts-ignore
    server.get('/admin/content', qufl.auth({ audience: "admin" }), async (req, res) => {
        res.send(200);
    })


    return server;
}
