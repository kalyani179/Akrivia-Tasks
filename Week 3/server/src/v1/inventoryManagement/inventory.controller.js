const knex = require('../../mysql/knex');
const { s3Client } = require('../../aws/s3/s3');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const dotenv = require('dotenv');
const backgroundTaskService = require('../../services/backgroundTaskService');
dotenv.config({ path: '../../.env' });

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
  const { productName, product_image, category, vendors, quantity, unit, status } = req.body;
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
    if (search && search.trim() !== '') {
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
              case 'unit':
                this.orWhere('products.unit', 'like', `%${search}%`);
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
            .orWhere('products.unit', 'like', `%${search}%`)
            .orWhere(function() {
              const statusSearch = search.toLowerCase();
              if (statusSearch.includes('available')) {
                this.orWhere('products.status', '=', 1);
              } else if (statusSearch.includes('out')) {
                this.orWhere('products.status', '=', 2);
              }
            });
          
          if (!isNaN(search)) {
            this.orWhere('products.quantity_in_stock', '=', parseInt(search));
          }
        });
      }
    }

    // Get total count for pagination
        const [{ total }] = await query.clone()
        .countDistinct('products.product_id as total');

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
        'products.unit',
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
  const { productName, category, vendors, quantity, unit, status, product_image } = req.body;
  const trx = await knex.transaction();

  // console.log(req.body);
  console.log(quantity);

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

const getProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await knex('products')
      .join('categories', 'products.category_id', '=', 'categories.category_id')
      .leftJoin('product_to_vendor', 'products.product_id', '=', 'product_to_vendor.product_id')
      .leftJoin('vendors', 'product_to_vendor.vendor_id', '=', 'vendors.vendor_id')
      .where('products.product_id', productId)
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
        'products.unit',
        'products.product_image',
        'products.status',
        'products.created_at',
        'products.updated_at'
      )
      .first();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const formattedProduct = {
      ...product,
      vendors: product.vendors ? product.vendors.split(',') : [],
      status: product.status === 1 ? 'Available' : product.status === 2 ? 'Out of Stock' : 'Low Stock'
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add these new methods
const uploadFileForProcessing = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const userId = req.user.userId;
    const fileKey = `uploads/${userId}/${Date.now()}_${fileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType
    };

    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Create file upload record
    const [fileUploadId] = await knex('file_uploads').insert({
      user_id: userId,
      file_name: fileName,
      file_key: fileKey,
      status: 'pending',
      created_at: new Date()
    });

    res.status(200).json({ 
      uploadUrl,
      fileUploadId
    });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ message: err.message });
  }
};

const getFileUploads = async (req, res) => {
  try {
    const userId = req.user.userId;
    const searchText = req.query.searchText || ''; 
    
    // Convert selectedColumns to array if it's a string
    let selectedColumns = [];
    if (req.query.selectedColumns) {
      selectedColumns = Array.isArray(req.query.selectedColumns) 
        ? req.query.selectedColumns 
        : [req.query.selectedColumns];
    }

    console.log('Search Parameters:', { searchText, selectedColumns }); 

    let query = knex('file_uploads')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    if (searchText && searchText.trim() !== '') {
      query = query.andWhere(function() {
        if (selectedColumns.length > 0) {
          selectedColumns.forEach(column => {
            switch(column) {
              case 'file_name':
                this.orWhere('file_name', 'like', `%${searchText}%`);
                break;
              case 'status':
                this.orWhere('status', 'like', `%${searchText}%`);
                break;
              case 'processed_count':
                if (!isNaN(searchText)) {
                  this.orWhere('processed_count', '=', parseInt(searchText));
                }
                break;
              case 'error_count':
                if (!isNaN(searchText)) {
                  this.orWhere('error_count', '=', parseInt(searchText));
                }
                break;
              case 'created_at':
                this.orWhere('created_at', 'like', `%${searchText}%`);
                break;
              case 'completed_at':
                this.orWhere('completed_at', 'like', `%${searchText}%`);
                break;
            }
          });
        } else {
          // If no specific columns selected, search in all columns
          this.orWhere('file_name', 'like', `%${searchText}%`)
            .orWhere('status', 'like', `%${searchText}%`);

          // Only search in numeric columns if the search text is a number
          if (!isNaN(searchText)) {
            this.orWhere('processed_count', '=', parseInt(searchText))
              .orWhere('error_count', '=', parseInt(searchText));
          }

          // Search in date columns
          this.orWhere('created_at', 'like', `%${searchText}%`)
            .orWhere('completed_at', 'like', `%${searchText}%`);
        }
      });
    }

    console.log('Generated SQL:', query.toString());

    const fileUploads = await query;
    console.log('Query results:', fileUploads.length);

    // Generate download URLs for error files where applicable
    const fileUploadsWithUrls = await Promise.all(fileUploads.map(async (upload) => {
      if (upload.error_file_key) {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: upload.error_file_key
        });
        const errorFileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { ...upload, errorFileUrl };
      }
      return upload;
    }));

    res.status(200).json(fileUploadsWithUrls);
  } catch (error) {
    console.error('Error fetching file uploads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const triggerProcessing = async (req, res) => {
  try {
    await backgroundTaskService.processUploadedFiles();
    res.json({ message: 'Processing triggered successfully' });
  } catch (error) {
    console.error('Error triggering processing:', error);
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
  updateProduct,
  updateCartProduct,
  getVendors,
  getCategories,
  getProduct,
  uploadFileForProcessing,
  getFileUploads,
  triggerProcessing
};

module.exports = inventoryController;