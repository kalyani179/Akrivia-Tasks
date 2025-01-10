/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
      table.increments('user_id').primary(); // Primary key
      table.string('firstname', 255).notNullable();
      table.string('lastname', 255).notNullable();
      table.string('username', 255).notNullable().unique(); // Unique username
      table.string('password', 255).notNullable(); // Hashed password
      table.string('email', 255).notNullable().unique(); // Unique email
      table.string('profile_pic', 255).defaultTo(null); // Profile picture URL
      table.string('thumbnail', 255).defaultTo(null); // Thumbnail URL
      table.integer('status').notNullable().defaultTo(0); // Default status: 0 (created)
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Auto timestamp
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // Auto timestamp
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
