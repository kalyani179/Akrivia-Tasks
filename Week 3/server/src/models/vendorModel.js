const { Model } = require('objection');

class Vendor extends Model {
  static get tableName() {
    return 'vendors';
  }

  static get idColumn() {
    return 'vendor_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['vendor_name', 'contact_name', 'address', 'city', 'postal_code', 'country', 'phone'],
      properties: {
        vendor_id: { type: 'integer' },
        vendor_name: { 
          type: 'string', 
          minLength: 1,
          maxLength: 255 
        },
        contact_name: { 
          type: 'string',
          minLength: 1,
          maxLength: 255 
        },
        address: { type: 'string' },
        city: { 
          type: 'string',
          minLength: 1,
          maxLength: 100 
        },
        postal_code: { 
          type: 'string',
          minLength: 1,
          maxLength: 20 
        },
        country: { 
          type: 'string',
          minLength: 1,
          maxLength: 100 
        },
        phone: { 
          type: 'string',
          minLength: 1,
          maxLength: 20 
        },
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
    const Product = require('./productModel');

    return {
      products: {
        relation: Model.ManyToManyRelation,
        modelClass: Product,
        join: {
          from: 'vendors.vendor_id',
          through: {
            from: 'product_to_vendor.vendor_id',
            to: 'product_to_vendor.product_id'
          },
          to: 'products.product_id'
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

module.exports = Vendor;

class Vendor extends Model {
  static get tableName() {
    return 'vendors';
  }

  static get idColumn() {
    return 'vendor_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['vendor_name', 'contact_name', 'address', 'city', 'postal_code', 'country', 'phone'],
      properties: {
        vendor_id: { type: 'integer' },
        vendor_name: { 
          type: 'string', 
          minLength: 1,
          maxLength: 255 
        },
        contact_name: { 
          type: 'string',
          minLength: 1,
          maxLength: 255 
        },
        address: { type: 'string' },
        city: { 
          type: 'string',
          minLength: 1,
          maxLength: 100 
        },
        postal_code: { 
          type: 'string',
          minLength: 1,
          maxLength: 20 
        },
        country: { 
          type: 'string',
          minLength: 1,
          maxLength: 100 
        },
        phone: { 
          type: 'string',
          minLength: 1,
          maxLength: 20 
        },
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
    const Product = require('./productModel');

    return {
      products: {
        relation: Model.ManyToManyRelation,
        modelClass: Product,
        join: {
          from: 'vendors.vendor_id',
          through: {
            from: 'product_to_vendor.vendor_id',
            to: 'product_to_vendor.product_id'
          },
          to: 'products.product_id'
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

module.exports = Vendor;