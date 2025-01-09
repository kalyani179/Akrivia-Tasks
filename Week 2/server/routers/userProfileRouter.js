const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../utils/jwtUtils');
const { getUsers, getProfile} = require('../controllers/userProfileController');

router.get('/user', authenticateToken, getProfile);
router.get('/users', authenticateToken, getUsers);

module.exports = router;