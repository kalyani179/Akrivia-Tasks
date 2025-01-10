const express = require('express');
const router = express.Router();

// Import the auth routes
const authRoutes = require('../v1/auth/auth.routes'); // Adjust the path as needed

// Use the auth routes
router.use('/auth', authRoutes); 

module.exports = router;
