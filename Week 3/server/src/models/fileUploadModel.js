const { Model } = require('objection');

class FileUpload extends Model {
  static get tableName() {
    return 'file_uploads';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'file_name', 'file_key'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        file_name: { type: 'string' },
        file_key: { type: 'string' },
        error_file_key: { type: ['string', 'null'] },
        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
        processed_count: { type: 'integer', default: 0 },
        error_count: { type: 'integer', default: 0 },
        error_message: { type: ['string', 'null'] },
        created_at: { type: 'string', format: 'date-time' },
        completed_at: { type: ['string', 'null'], format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User'); // Adjust the path as needed

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'file_uploads.user_id',
          to: 'users.id',
        },
      },
    };
  }
}

module.exports = FileUpload;
