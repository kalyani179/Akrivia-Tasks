/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
const { faker } = require('@faker-js/faker');

exports.seed = async function (knex) {
  // Fetch product and vendor IDs to ensure valid foreign key references
  const products = await knex('products').select('product_id');
  const vendors = await knex('vendors').select('vendor_id');
  
  const productIds = products.map((product) => product.product_id);
  const vendorIds = vendors.map((vendor) => vendor.vendor_id);

  // Generate fake data for product_to_vendor
  const fakeProductToVendor = Array.from({ length: 10 }, () => ({
    vendor_id: faker.helpers.arrayElement(vendorIds), // Random valid vendor ID
    product_id: faker.helpers.arrayElement(productIds), // Random valid product ID
    status: faker.number.int({ min: 0, max: 2 }), // Random status (0, 1, or 2)
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  }));

  // Delete existing data and insert the new fake data
  await knex('product_to_vendor').del(); // Clear existing data
  await knex('product_to_vendor').insert(fakeProductToVendor); // Insert new fake data
};

