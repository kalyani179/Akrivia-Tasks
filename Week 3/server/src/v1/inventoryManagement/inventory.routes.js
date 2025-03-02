const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { authenticateToken } = require('../../middleware/jwt/jwt.middleware');

// Make sure controller functions exist before setting up routes
if (!inventoryController.generatePresignedUrl || !inventoryController.addProduct || !inventoryController.getInventory || !inventoryController.getVendorCount || !inventoryController.getAllInventory || !inventoryController.deleteProduct) {
  throw new Error('Required controller functions are not properly exported');
}

require('./api-docs/inventory.docs');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate presigned URL for S3 upload
router.post('/presigned-url', inventoryController.generatePresignedUrl);

// Generate presigned URL for product image upload
router.post('/add-prodcut-image', inventoryController.generatePresignedUrlProductImage);

// Add new product
router.post('/add', inventoryController.addProduct);

// Get all inventory items
router.get('/inventory', inventoryController.getInventory);

// Get all inventory items without pagination
router.get('/inventory/all', inventoryController.getAllInventory);

// Get vendor count
router.get('/vendors/count', inventoryController.getVendorCount);

// Delete product
router.delete('/inventory/:productId', inventoryController.deleteProduct);

// Update product
router.put('/inventory/:productId', inventoryController.updateProduct);

// Update cart product
router.put('/cart/:productId', inventoryController.updateCartProduct);

// Add these routes
router.get('/vendors', inventoryController.getVendors);
  
// Get categories
router.get('/categories', inventoryController.getCategories);

// Get single product
router.get('/getProduct/:productId', inventoryController.getProduct);

// Add new routes for file processing
router.post('/upload-file', inventoryController.uploadFileForProcessing);

router.get('/file-uploads', inventoryController.getFileUploads);
router.post('/trigger-processing', inventoryController.triggerProcessing);

module.exports = router;
