const knex = require('../../mysql/knex');
const { s3Client } = require('../../aws/s3/s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

// Generate presigned URL for S3 upload
const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const userId = req.user.userId;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `products/${userId}/${Date.now()}_${fileName}`,
      ContentType: fileType
    };

    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ message: err.message });
  }
};

// Add new product
const addProduct = async (req, res) => {
  try {
    const {
      productName,
      category,
      vendor,
      quantity,
      unit,
      status,
      imageUrl  // This will be the S3 URL after upload
    } = req.body;

    // Get category_id from categories table
    const categoryRecord = await knex('categories')
      .where('category_name', category)
      .first();

    if (!categoryRecord) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const productData = {
      product_name: productName,
      category_id: categoryRecord.category_id,
      quantity_in_stock: quantity,
      unit_price: parseFloat(unit),
      product_image: imageUrl || '',
      status: status === 'Available' ? 1 : status === 'Out of Stock' ? 2 : 0
    };

    const [productId] = await knex('products')
      .insert(productData)
      .returning('product_id');

    const newProduct = await knex('products')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .where('product_id', productId)
      .first();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all inventory items
const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [{ total }] = await knex('products')
      .where('status', '!=', 99)
      .count('* as total');

    // Get paginated data
    const inventory = await knex('products')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
      .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
      .select(
        'products.product_id',
        'products.product_name',
        'categories.category_name as category',
        'products.quantity_in_stock',
        'products.unit_price',
        'products.product_image',
        'products.status',
        'products.created_at',
        'products.updated_at',
        knex.raw('GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendors')
      )
      .where('products.status', '!=', 99)
      .groupBy(
        'products.product_id',
        'products.product_name',
        'categories.category_name',
        'products.quantity_in_stock',
        'products.unit_price',
        'products.product_image',
        'products.status',
        'products.created_at',
        'products.updated_at'
      )
      .orderBy('products.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const formattedInventory = inventory.map(item => ({
      ...item,
      vendors: item.vendors ? item.vendors.split(',') : [],
      status: item.status === 1 ? 'Available' : item.status === 2 ? 'Out of Stock' : 'Low Stock'
    }));

    res.json({
      items: formattedInventory,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export all functions
const inventoryController = {
  generatePresignedUrl,
  addProduct,
  getInventory
};

module.exports = inventoryController;