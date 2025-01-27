const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
const { encrypt, decrypt } = require('../../constants/encrypt.decrypt');
dotenv.config({ path: '../../.env' });

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

const generateAccessToken = (user) => {
  const userPayload = JSON.stringify(user);
  const encryptedPayload = encrypt(userPayload, JWT_SECRET);
  return jwt.sign({ data: encryptedPayload }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
};

const generateRefreshToken = (user) => {
  const userPayload = JSON.stringify(user);
  const encryptedPayload = encrypt(userPayload, REFRESH_TOKEN_SECRET);
  return jwt.sign({ data: encryptedPayload }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
};

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token required' });

  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    try {
      const decryptedPayload = decrypt(decoded.data, JWT_SECRET);
      req.user = JSON.parse(decryptedPayload);
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Failed to decrypt the token payload' });
    }
  });
};


module.exports = { authenticateToken, generateAccessToken, generateRefreshToken };