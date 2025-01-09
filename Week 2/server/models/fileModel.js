const { Model } = require('objection');
const { knex } = require('../utils/database'); // Correctly import the knex instance
const User = require('./userModel'); // Import the User model

Model.knex(knex);

class File extends Model {
  static get tableName() {
    return 'files';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'fileName', 'fileUrl'],

      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        fileName: { type: 'string', minLength: 1, maxLength: 255 },
        fileUrl: { type: 'string', minLength: 1, maxLength: 255 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'files.userId',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = File;