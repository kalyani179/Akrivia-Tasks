const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../utils/jwtUtils');
const { profileUpload, getProfile, getUsers } = require('../controllers/userProfileController');

router.get('/user', authenticateToken, getProfile);
router.get('/users', authenticateToken, getUsers);
router.post('/upload', authenticateToken, profileUpload);

module.exports = router;