const { faker } = require('@faker-js/faker');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Fetch category IDs to ensure valid foreign key references
  const categories = await knex('categories').select('category_id');
  const categoryIds = categories.map((category) => category.category_id);

  // Predefined list of 10 product names
  const productNames = [
    'Maggie', 'Bread', 'Butter', 'Milk', 'Cheese', 'Eggs', 'Rice', 
    'Wheat Flour', 'Sugar', 'Salt'
  ];

  // Generate 100 fake products by repeating the 10 products
  const fakeProducts = Array.from({ length: 100 }, (_, index) => ({
    product_name: productNames[index % productNames.length],
    category_id: faker.helpers.arrayElement(categoryIds),
    quantity_in_stock: faker.number.int({ min: 10, max: 100 }),
    unit_price: parseFloat(faker.commerce.price(1, 100, 2)),
    product_image: faker.image.url(),
    status: faker.number.int({ min: 0, max: 2 }),
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  }));

  await knex('products').del(); // Clear existing data
  await knex('products').insert(fakeProducts);
};
