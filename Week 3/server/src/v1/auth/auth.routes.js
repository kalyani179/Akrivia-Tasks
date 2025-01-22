const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword } = require('./auth.controller');
const { refreshToken } = require('../../middleware/jwt/jwt.middleware');

// Import API documentation files
require('./api-docs/signup.docs');
require('./api-docs/login.docs');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:accessToken', resetPassword);

module.exports = router;