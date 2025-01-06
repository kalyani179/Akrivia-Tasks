const { Model } = require('objection');
const { knex } = require('../utils/database'); 

// Define the User model.
class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'email', 'password', 'dob', 'gender', 'course'],

      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 1, maxLength: 255 },
        gender: { type: 'string', enum: ['male', 'female'] },
        dob: { type: 'string', format: 'date' },
        course: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', minLength: 1, maxLength: 255 },
        password: { type: 'string', minLength: 1, maxLength: 255 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }
}

// Create user
const createUser = async (username, email, password, dob, gender, course) => {
  try {
    const user = await User.query().insert({ username, email, password, dob, gender, course });
    return user;
  } catch (err) {
    throw err;
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  try {
    const user = await User.query().findOne({ email });
    return user;
  } catch (err) {
    throw err;
  }
};

// Get users with pagination
const getPaginatedUsers = async (page, limit) => {
  const offset = (page - 1) * limit;
  const users = await knex('users').limit(limit).offset(offset);
  const totalResults = await knex('users').count('id as total');
  const total = totalResults[0].total;
  return { users, total };
};

// Get user by ID
const getUserById = async (userId) => {
  const user = await knex('users').where({ id: userId }).first();
  return user;
};

module.exports = { createUser, getUserByEmail, getPaginatedUsers, getUserById };