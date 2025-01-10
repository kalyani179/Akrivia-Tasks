const express = require('express');
const router = express.Router();
const { signup, login } = require('./auth.controller');

// Import API documentation files
require('./api-docs/signup.docs');
require('./api-docs/login.docs');

router.post('/signup', signup);
router.post('/login', login);

module.exports = router;