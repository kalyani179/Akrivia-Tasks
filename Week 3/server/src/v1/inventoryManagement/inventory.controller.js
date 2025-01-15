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

const generatePresignedUrlProductImage = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const userId = req.user.userId;
    const key = `products/${userId}/${Date.now()}_${fileName}`;
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    };
    
    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 60,
      signableHeaders: new Set(['host'])
    });
    
    // Generate the permanent URL for the image
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    res.status(200).json({ 
      uploadUrl,
      imageUrl 
    });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ message: err.message });
  }
};  

// Add new product
const addProduct = async (req, res) => {
  const { productName, product_image,category, vendors, quantity, unit, status } = req.body;
  const trx = await knex.transaction();

  try {
    // Get category_id from category name
    const [categoryResult] = await trx('categories')
      .select('category_id')
      .where('category_name', category);

    if (!categoryResult) {
      throw new Error('Invalid category');
    }

    // Insert into products table
    const [productId] = await trx('products')
      .insert({
        product_name: productName,
        product_image: product_image,
        category_id: categoryResult.category_id,
        quantity_in_stock: quantity,
        unit: unit,
        status: status === 'Active' ? 1 : status === 'Inactive' ? 2 : status === 'Deleted' ? 99 : 0,
        created_at: new Date(),
        updated_at: new Date()
      });

    // Get vendor IDs from vendor names
    const vendorIds = await trx('vendors')
      .select('vendor_id')
      .whereIn('vendor_name', vendors);

    // Insert into product_to_vendor table
    const productVendorRecords = vendorIds.map(({ vendor_id }) => ({
      product_id: productId,
      vendor_id: vendor_id,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await trx('product_to_vendor').insert(productVendorRecords);

    await trx.commit();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId
    });
  } catch (error) {
    await trx.rollback();
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// Get all inventory items
const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const columns = req.query.columns ? req.query.columns.split(',') : [];
    const offset = (page - 1) * limit;

    let query = knex('products')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
      .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
      .where('products.status', '!=', 99);

    // Apply search filter if search text is provided
    if (search) {
      if (columns.length > 0) {
        // Search in specific columns
        query = query.andWhere(function() {
          columns.forEach(column => {
            switch(column) {
              case 'product_name':
                this.orWhere('products.product_name', 'like', `%${search}%`);
                break;
              case 'category':
                this.orWhere('categories.category_name', 'like', `%${search}%`);
                break;
              case 'status':
                const statusSearch = search.toLowerCase();
                if (statusSearch.includes('available')) {
                  this.orWhere('products.status', '=', 1);
                } else if (statusSearch.includes('out')) {
                  this.orWhere('products.status', '=', 2);
                } else if (statusSearch.includes('low')) {
                  this.orWhere('products.status', '=', 3);
                }
                break;
              case 'vendors':
                this.orWhere('vendors.vendor_name', 'like', `%${search}%`);
                break;
              case 'quantity_in_stock':
                if (!isNaN(search)) {
                  this.orWhere('products.quantity_in_stock', '=', parseInt(search));
                }
                break;
              case 'unit_price':
                if (!isNaN(search)) {
                  this.orWhere('products.unit_price', '=', parseFloat(search));
                }
                break;
            }
          });
        });
      } else {
        // Search in all searchable columns if no specific columns selected
        query = query.andWhere(function() {
          this.where('products.product_name', 'like', `%${search}%`)
            .orWhere('categories.category_name', 'like', `%${search}%`)
            .orWhere('vendors.vendor_name', 'like', `%${search}%`)
            .orWhere(function() {
              const statusSearch = search.toLowerCase();
              if (statusSearch.includes('available')) {
                this.orWhere('products.status', '=', 1);
              } else if (statusSearch.includes('out')) {
                this.orWhere('products.status', '=', 2);
              } else if (statusSearch.includes('low')) {
                this.orWhere('products.status', '=', 3);
              }
            });
          
          if (!isNaN(search)) {
            this.orWhere('products.quantity_in_stock', '=', parseInt(search))
              .orWhere('products.unit_price', '=', parseFloat(search));
          }
        });
      }
    }

    // Get total count
    const [{ total }] = await query.clone().count('* as total');

    // Get paginated data
    const inventory = await query
      .select(
        'products.product_id',
        'products.product_name',
        'categories.category_name as category',
        'products.quantity_in_stock',
        'products.unit',
        'products.product_image',
        'products.status',
        'products.created_at',
        'products.updated_at',
        knex.raw('GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendors')
      )
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

// Get all inventory items
const getAllInventory = async (req, res) => {
  try {
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
      .orderBy('products.created_at', 'desc');

    const formattedInventory = inventory.map(item => ({
      ...item,
      vendors: item.vendors ? item.vendors.split(',') : [],
      status: item.status === 1 ? 'Available' : item.status === 2 ? 'Out of Stock' : 'Low Stock'
    }));

    res.json(formattedInventory);
  } catch (error) {
    console.error('Error fetching all inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get vendor count
const getVendorCount = async (req, res) => {
  try {
    const [{ count }] = await knex('vendors')
      .where('status', '!=', 99)
      .count('* as count');

    res.json({ count: parseInt(count) });
  } catch (error) {
    console.error('Error getting vendor count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  await knex('products').where('product_id', productId).update({ status: 99 });
  res.json({ message: 'Product deleted successfully' });
};

// Add this new function to handle bulk product upload
const bulkAddProducts = async (req, res) => {
  const { products } = req.body;
  const trx = await knex.transaction();

  try {
    // Array to store all product insertion promises
    const productInsertions = products.map(async (product) => {
      // Get category_id from category name
      const [categoryResult] = await trx('categories')
        .select('category_id')
        .where('category_name', product.category);

      if (!categoryResult) {
        throw new Error(`Invalid category: ${product.category}`);
      }

      // Insert into products table
      const [productId] = await trx('products')
        .insert({
          product_name: product.productName,
          category_id: categoryResult.category_id,
          quantity_in_stock: product.quantity,
          unit: product.unit,
          status: product.status === 'Active' ? 1 : product.status === 'Inactive' ? 2 : 0,
          created_at: new Date(),
          updated_at: new Date()
        });

      // Get vendor IDs from vendor names
      const vendorNames = Array.isArray(product.vendors) ? product.vendors : product.vendors.split(',').map(v => v.trim());
      const vendorIds = await trx('vendors')
        .select('vendor_id')
        .whereIn('vendor_name', vendorNames);

      // Insert into product_to_vendor table
      const productVendorRecords = vendorIds.map(({ vendor_id }) => ({
        product_id: productId,
        vendor_id: vendor_id,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await trx('product_to_vendor').insert(productVendorRecords);

      return productId;
    });

    // Wait for all product insertions to complete
    const insertedProductIds = await Promise.all(productInsertions);

    await trx.commit();

    res.status(201).json({
      success: true,
      message: 'Products added successfully',
      productIds: insertedProductIds
    });
  } catch (error) {
    await trx.rollback();
    console.error('Error adding products:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

const updateCartProduct = async (req, res) => {
  const {product_id, quantity_in_stock, status } = req.body;
  try { 
    await knex('products').where('product_id', product_id).update({
       quantity_in_stock : quantity_in_stock,
       status : status 
    });
    res.json({ message: 'Product updated successfully' });  
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add this to your inventory controller
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { productName, category, vendors, quantity, unit, status,product_image } = req.body;
  const trx = await knex.transaction();

  console.log(req.body);
  console.log(productName);

  try {
    // Get category_id from category name
    const [categoryResult] = await trx('categories')
      .select('category_id')
      .where('category_name', category);

    if (!categoryResult) {
      throw new Error('Invalid category');
    }

    // Update products table
    await trx('products')
      .where('product_id', productId)
      .update({
        product_name: productName,
        product_image: product_image,
        category_id: categoryResult.category_id,
        quantity_in_stock: quantity,
        unit: unit,
        status: status === 'Active' ? 1 : status === 'Inactive' ? 2 : 0,
        updated_at: new Date()
      });

    // Update product_to_vendor relationships
    await trx('product_to_vendor')
      .where('product_id', productId)
      .del();

    const vendorIds = await trx('vendors')
      .select('vendor_id')
      .whereIn('vendor_name', vendors);

    const productVendorRecords = vendorIds.map(({ vendor_id }) => ({
      product_id: productId,
      vendor_id: vendor_id,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await trx('product_to_vendor').insert(productVendorRecords);

    await trx.commit();

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    await trx.rollback();
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add these methods to your controller
const getVendors = async (req, res) => {
  try {
    const vendors = await knex('vendors')
      .select('vendor_id', 'vendor_name')
      .where('status', '!=', 99);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await knex('categories')
      .select('category_id', 'category_name')
      .where('status', '!=', 99);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export all functions
const inventoryController = {
  generatePresignedUrl,
  generatePresignedUrlProductImage,
  addProduct,
  getInventory,
  getVendorCount,
  getAllInventory,
  deleteProduct,
  bulkAddProducts,
  updateProduct,
  updateCartProduct,
  getVendors,
  getCategories
};

module.exports = inventoryController;