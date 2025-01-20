const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users'; // Name of your database table
  }

  static get idColumn() {
    return 'id'; // Primary key column
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstname', 'lastname','username', 'email', 'password'], // Validation for required fields
      properties: {
        id: { type: 'integer' }, // Primary key
        firstname: { type: 'string', minLength: 1, maxLength: 255 }, // First name 
        lastname: { type: 'string', minLength: 1, maxLength: 255 }, // Last name 
        username: { type: 'string', minLength: 1, maxLength: 255 }, // Unique username
        email: { type: 'string', format: 'email' }, // Email (must be a valid email)
        password: { type: 'string', minLength: 6 }, // Hashed password (minimum length)
        profile_pic: { type: ['string', 'null'], maxLength: 255 }, // Profile picture (nullable string)
        thumbnail: { type: ['string', 'null'], maxLength: 255 }, // Thumbnail URL (nullable string)
        status: { type: 'integer', default: 0 }, // User status (default is 0)
        created_at: { type: 'string', format: 'date-time' }, // Timestamp (created_at)
        updated_at: { type: 'string', format: 'date-time' }, // Timestamp (updated_at)
      },
    };
  }
}

module.exports = User;
