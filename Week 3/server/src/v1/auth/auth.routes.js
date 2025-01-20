const express = require('express');
const router = express.Router();
const { signup, login } = require('./auth.controller');
const { refreshToken } = require('../../middleware/jwt/jwt.middleware');

// Import API documentation files
require('./api-docs/signup.docs');
require('./api-docs/login.docs');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

module.exports = router;