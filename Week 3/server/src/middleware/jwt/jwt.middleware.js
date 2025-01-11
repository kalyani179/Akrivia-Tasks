const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET);

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token required' });

  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    req.user = decoded;
    next();
  });
};

module.exports = authenticateToken;