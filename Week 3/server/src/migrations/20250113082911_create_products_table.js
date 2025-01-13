/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('products', (table) => {
      table.increments('product_id').primary();
      table.string('product_name').notNullable();
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('category_id')
        .inTable('categories')
        .onDelete('CASCADE')
        .onUpdate('CASCADE'); // Foreign key referencing categories table
      table.integer('quantity_in_stock').unsigned().defaultTo(0).comment('0: default, 1: active, 2: inactive, 99: deleted');
      table.decimal('unit_price', 10, 2).notNullable();
      table.string('product_image').defaultTo('');
      table.integer('status').defaultTo(0); // 0: default, 1: active, 2: inactive, 99: deleted
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('products');
};
