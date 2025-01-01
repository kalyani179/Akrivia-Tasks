const jwt = require('jsonwebtoken');
const JWT_SECRET = 'kalyani@179';
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']; // Typically sent as "Bearer <token>"
    if (!token) return res.status(403).json({ message: 'Token required' });
  
    jwt.verify(token.split(" ")[1], JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
  
      req.user = user; // Attach user info to the request object
      next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateToken;