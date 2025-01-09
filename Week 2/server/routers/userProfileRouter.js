const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/jwtUtils');
const { getUsers, getProfile, updateUser, deleteUser } = require('../controllers/userProfileController');

router.get('/users', authenticateToken, getUsers);
router.get('/user', authenticateToken, getProfile);
router.get('/user/:id', authenticateToken, getProfile); // Ensure this route is included
router.put('/user/:id', authenticateToken, updateUser);
router.delete('/user/:id', authenticateToken, deleteUser);

module.exports = router;