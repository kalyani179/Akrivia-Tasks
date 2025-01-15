const { Model } = require('objection');

class Product extends Model {
  static get tableName() {
    return 'products';
  }

  static get idColumn() {
    return 'product_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['product_name', 'category_id', 'unit_price'],
      properties: {
        product_id: { type: 'integer' },
        product_name: { type: 'string', minLength: 1 },
        category_id: { type: 'integer' },
        quantity_in_stock: { type: 'integer', minimum: 0, default: 0 },
        unit: { type: 'string', minLength: 1 },
        unit_price: { type: 'number', minimum: 0 },
        product_image: { type: 'string', default: '' },
        status: { 
          type: 'integer', 
          enum: [0, 1, 2, 99], 
          default: 0,
          description: '0: default, 1: active, 2: inactive, 99: deleted'
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Category = require('./categoryModel');
    const Vendor = require('./vendorModel');

    return {
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'products.category_id',
          to: 'categories.category_id'
        }
      },
      vendors: {
        relation: Model.ManyToManyRelation,
        modelClass: Vendor,
        join: {
          from: 'products.product_id',
          through: {
            from: 'product_to_vendor.product_id',
            to: 'product_to_vendor.vendor_id'
          },
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

module.exports = Product;
