const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

router.get('/', inventoryController.getAllProducts);
router.get('/cart', inventoryController.getCartProducts);
router.post('/cart', inventoryController.addToCart);
router.delete('/cart/:id', inventoryController.removeFromCart);

module.exports = router;