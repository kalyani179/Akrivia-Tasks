/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.up = async function (knex) {
    await knex.schema.createTable('product_to_vendor', (table) => {
      table.increments('product_to_vendor_id').primary(); // Primary key
      table
        .integer('vendor_id')
        .unsigned()
        .notNullable()
        .references('vendor_id')
        .inTable('vendors')
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('product_id')
        .inTable('products')
      table.integer('status').defaultTo(0); // Status (0: created, 1: active, 2: inactive, 99: deleted)
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Created timestamp
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // Updated timestamp
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> } 
   */
  exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('product_to_vendor'); // Drop the table if exists
  };
  