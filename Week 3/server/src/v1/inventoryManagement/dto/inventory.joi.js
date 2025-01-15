const Joi = require('joi');

const generatePresignedUrlSchema = Joi.object({
  fileName: Joi.string().required()
});

const generatePresignedUrlProductImageSchema = Joi.object({
  fileName: Joi.string().required(),
  fileType: Joi.string().required()
});

const addProductSchema = Joi.object({
  product_name: Joi.string().required(),
  category: Joi.string().required(),
  quantity_in_stock: Joi.number().required()
});

const getInventorySchema = Joi.object({
  vendor_id: Joi.number().required(),
  page: Joi.number().required(),
  limit: Joi.number().required(),
  search: Joi.string().required(),
  columns: Joi.string().required()
});

const deleteProductSchema = Joi.object({
  product_id: Joi.number().required()
});

const bulkAddProductsSchema = Joi.object({
  products: Joi.array().items(Joi.object({
    product_name: Joi.string().required(),
    category: Joi.string().required(),
    quantity_in_stock: Joi.number().required()
  })).required()
});

const updateProductSchema = Joi.object({
  product_id: Joi.number().required(),
  product_name: Joi.string().required(),
  category: Joi.string().required(),
  quantity_in_stock: Joi.number().required()
}); 

const updateCartProductSchema = Joi.object({
  product_id: Joi.number().required(),
  quantity: Joi.number().required()
}); 


module.exports = {
  generatePresignedUrlSchema,
  generatePresignedUrlProductImageSchema,
  addProductSchema,
  getInventorySchema,
  deleteProductSchema,
  bulkAddProductsSchema,
  updateProductSchema,
  updateCartProductSchema,
};






