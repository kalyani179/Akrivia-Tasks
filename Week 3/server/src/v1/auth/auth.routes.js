const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword,refreshAccessToken } = require('./auth.controller');

// Import API documentation files
require('./api-docs/signup.docs');
require('./api-docs/login.docs');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:accessToken', resetPassword);

module.exports = router;