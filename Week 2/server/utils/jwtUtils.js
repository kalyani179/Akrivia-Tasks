const jwt = require('jsonwebtoken');
const { decrypt } = require('./encryptUtils');
const dotenv = require('dotenv');
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
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

module.exports = authenticateToken;