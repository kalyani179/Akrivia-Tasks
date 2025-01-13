const express = require('express');
const router = express.Router();

// Import the routes
const authRoutes = require('./auth/auth.routes');
const profileRoutes = require('./profile/profile.routes');
const filesRoutes = require('./filesUploaded/files.routes');
const inventoryRoutes = require('./inventoryManagement/inventory.routes');  

// Use the routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/files', filesRoutes);
router.use('/inventory', inventoryRoutes);

module.exports = router;