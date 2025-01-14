const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/jwt/jwt.middleware');
const inventoryController = require('./inventory.controller');

// Make sure controller functions exist before setting up routes
if (!inventoryController.generatePresignedUrl || !inventoryController.addProduct || !inventoryController.getInventory || !inventoryController.getVendorCount || !inventoryController.getAllInventory || !inventoryController.deleteProduct  ) {
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

// Get all inventory items without pagination
router.get('/inventory/all', inventoryController.getAllInventory);

// Get vendor count
router.get('/vendors/count', inventoryController.getVendorCount);

// Delete product
router.delete('/inventory/:productId', inventoryController.deleteProduct);

module.exports = router;
