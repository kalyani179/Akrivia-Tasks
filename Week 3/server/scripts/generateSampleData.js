const XLSX = require('xlsx');
const { faker } = require('@faker-js/faker');

const generateSampleData = (count = 5000) => {
  const products = [];
  const categories = ['Product Designer', 'Product Manager', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UX Designer', 'UX Copywriter', 'UI Designer', 'QA Engineer'];
  const vendors = ['Zepto', 'Blinkit', 'Fresh Meat', 'Swiggy'];

  for (let i = 0; i < count; i++) {
    products.push({
      'Product Name': faker.commerce.productName(),
      'Category': faker.helpers.arrayElement(categories),
      'Vendors': faker.helpers.arrayElements(vendors, { min: 1, max: 3 }).join(','),
      'Quantity': faker.number.int({ min: 0, max: 1000 }),
      'Unit': faker.number.int({ min: 0, max: 2000 })
    });
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(products);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  XLSX.writeFile(workbook, 'sample_products_5000.xlsx');
  console.log(`Generated ${count} sample products in sample_products.xlsx`);
};

generateSampleData();
