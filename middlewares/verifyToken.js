const jwt=require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    if (!token) {
        return res.status(401).end();
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decodedValue) => {
        if (err) {
            return res.status(403).end();
        }
        req.email = decodedValue.email;
        next();
    });
}

module.exports = verifyToken;