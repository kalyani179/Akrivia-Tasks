const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/jwt/jwt.middleware');
const inventoryController = require('./inventory.controller');

// Make sure controller functions exist before setting up routes
if (!inventoryController.generatePresignedUrl || !inventoryController.addProduct || !inventoryController.getInventory) {
  throw new Error('Required controller functions are not properly exported');
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate presigned URL for S3 upload
router.post('/presigned-url', inventoryController.generatePresignedUrl);

// Add new product
router.post('/', inventoryController.addProduct);

// Get all inventory items
router.get('/inventory', inventoryController.getInventory);

module.exports = router;