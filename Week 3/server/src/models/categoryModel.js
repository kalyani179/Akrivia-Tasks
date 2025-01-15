const { Model } = require('objection');

class Category extends Model {
  static get tableName() {
    return 'categories';
  }

  static get idColumn() {
    return 'category_id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['category_name'],
      properties: {
        category_id: { type: 'integer' },
        category_name: { 
          type: 'string', 
          minLength: 1,
          maxLength: 255 
        },
        description: { 
          type: 'string',
          nullable: true 
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
        relation: Model.HasManyRelation,
        modelClass: Product,
        join: {
          from: 'categories.category_id',
          to: 'products.category_id'
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

module.exports = Category;