const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/userAuthController');
const { refreshToken } = require('../utils/jwtUtils');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

module.exports = router;