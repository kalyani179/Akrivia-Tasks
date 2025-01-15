const { Model } = require('objection');

class ProductToVendor extends Model {
  static get tableName() {
    return 'product_to_vendor';
  }

  static get idColumn() {
    return 'product_to_vendor_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['vendor_id', 'product_id'],
      properties: {
        product_to_vendor_id: { type: 'integer' },
        vendor_id: { type: 'integer' },
        product_id: { type: 'integer' },
        status: { 
          type: 'integer', 
          enum: [0, 1, 2, 99], 
          default: 0,
          description: '0: created, 1: active, 2: inactive, 99: deleted'
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Product = require('./productModel');
    const Vendor = require('./vendorModel');

    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: Product,
        join: {
          from: 'product_to_vendor.product_id',
          to: 'products.product_id'
        }
      },
      vendor: {
        relation: Model.BelongsToOneRelation,
        modelClass: Vendor,
        join: {
          from: 'product_to_vendor.vendor_id',
          to: 'vendors.vendor_id'
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = ProductToVendor; 