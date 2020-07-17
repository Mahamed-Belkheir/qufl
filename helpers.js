function getToken(req) {
    let header = req.headers['authorization'];
    if (!header) return false;
    return header.slice(7)
};


module.exports = { getToken }