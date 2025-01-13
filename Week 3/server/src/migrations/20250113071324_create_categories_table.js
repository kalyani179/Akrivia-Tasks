/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('categories', (table) => {
      table.increments('category_id').primary();
      table.string('category_name', 255).notNullable().unique();
      table.text('description').nullable();
      table.integer('status').defaultTo(0).comment('0: default, 1: active, 2: inactive, 99: deleted');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('categories');
  };