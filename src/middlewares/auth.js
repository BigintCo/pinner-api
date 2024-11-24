const jwt = require('jsonwebtoken');

function generateToken(user) {
    const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: '365d' });
    return token;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token missing' });
    }

    try {
        const secretKey = process.env.JWT_SECRET_KEY;
        const user = jwt.verify(token, secretKey);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

module.exports = {
    authenticateToken,
    generateToken
}