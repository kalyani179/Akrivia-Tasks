/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           description: The product's unique identifier
 *         product_name:
 *           type: string
 *           description: Name of the product
 *         category:
 *           type: string
 *           description: Product category
 *         quantity_in_stock:
 *           type: integer
 *           description: Available quantity
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         product_image:
 *           type: string
 *           description: URL of the product image
 *         status:
 *           type: string
 *           enum: [Available, Out of Stock, Low Stock]
 *         vendors:
 *           type: array
 *           items:
 *             type: string
 *           description: List of vendor names
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 *     InventoryResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         total:
 *           type: integer
 *           description: Total number of items
 *         page:
 *           type: integer
 *           description: Current page number
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 * 
 *     VendorCount:
 *       type: object
 *       properties:
 *         count:
 *           type: integer
 *           description: Total number of vendors
 * 
 *     Vendor:
 *       type: object
 *       properties:
 *         vendor_id:
 *           type: integer
 *         vendor_name:
 *           type: string
 * 
 *     Category:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *         category_name:
 *           type: string
 * 
 * @swagger
 * /api/inventory/presigned-url:
 *   post:
 *     summary: Generate a presigned URL for file upload
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 * 
 * @swagger
 * /api/inventory/add-prodcut-image:
 *   post:
 *     summary: Generate a presigned URL for product image upload
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 * 
 * @swagger
 * /api/inventory/add:
 *   post:
 *     summary: Add a new product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - category
 *               - vendors
 *               - quantity
 *               - unit
 *             properties:
 *               productName:
 *                 type: string
 *               product_image:
 *                 type: string
 *               category:
 *                 type: string
 *               vendors:
 *                 type: array
 *                 items:
 *                   type: string
 *               quantity:
 *                 type: integer
 *               unit:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Product added successfully
 * 
 * @swagger
 * /api/inventory/inventory:
 *   get:
 *     summary: Get paginated inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryResponse'
 * 
 * @swagger
 * /api/inventory/inventory/all:
 *   get:
 *     summary: Get all inventory items without pagination
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 * 
 * @swagger
 * /api/inventory/vendors/count:
 *   get:
 *     summary: Get total vendor count
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorCount'
 * 
 * @swagger
 * /api/inventory/inventory/{productId}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 * 
 *   put:
 *     summary: Update a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 * 
 * @swagger
 * /api/inventory/bulk-add:
 *   post:
 *     summary: Bulk add products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Products added successfully
 * 
 * @swagger
 * /api/inventory/cart/{productId}:
 *   put:
 *     summary: Update product in cart
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity_in_stock:
 *                 type: integer
 *               status:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart product updated successfully
 * 
 * @swagger
 * /api/inventory/vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vendor'
 * 
 * @swagger
 * /api/inventory/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

module.exports = {
  schemas: {
    Product: {
      type: 'object',
      properties: {
        product_id: { type: 'integer' },
        product_name: { type: 'string' },
        category: { type: 'string' },
        quantity_in_stock: { type: 'integer' },
        unit: { type: 'string' },
        product_image: { type: 'string' },
        status: { type: 'string', enum: ['Available', 'Out of Stock', 'Low Stock'] },
        vendors: { type: 'array', items: { type: 'string' } },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    },
    Vendor: {
      type: 'object',
      properties: {
        vendor_id: { type: 'integer' },
        vendor_name: { type: 'string' }
      }
    },
    Category: {
      type: 'object',
      properties: {
        category_id: { type: 'integer' },
        category_name: { type: 'string' }
      }
    }
  }
};
