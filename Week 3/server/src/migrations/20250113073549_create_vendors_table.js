/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('vendors', (table) => {
      table.increments('vendor_id').primary();
      table.string('vendor_name', 255).notNullable().unique();
      table.string('contact_name', 255).notNullable();
      table.text('address').notNullable();
      table.string('city', 100).notNullable();
      table.string('postal_code', 20).notNullable();
      table.string('country', 100).notNullable();
      table.string('phone', 20).notNullable();
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
    return knex.schema.dropTable('vendors');
  };