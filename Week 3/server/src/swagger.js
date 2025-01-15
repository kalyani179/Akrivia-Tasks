const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task 3',
      version: '1.0.0',
      description: 'Product Inventory Routes',
    },
    servers: [
      {
        url: 'http://localhost:3000', 
      },
    ],
  },
  apis: ['./v1/auth/api-docs/*.docs.js', './v1/profile/api-docs/*.docs.js', './v1/inventoryManagement/api-docs/*.docs.js', './v1/filesUploaded/api-docs/*.docs.js' ], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };