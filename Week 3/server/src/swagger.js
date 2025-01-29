// Swagger is an open-source tool for designing, documenting, and testing RESTful APIs
const swaggerJsdoc = require('swagger-jsdoc'); // Generates Swagger/OpenAPI specs from comments in your code 
const swaggerUi = require('swagger-ui-express'); // Serves the generated API documentation through a web interface.

const options = {
  definition: {
    openapi: '3.0.0', // standard specification for defining, describing, and documenting RESTful APIs in a machine-readable format.
    info: {
      title: 'Inventory Management System',
      version: '1.0.0',
      description: 'Inventory Management System Routes',
    },
    servers: [
      {
        url: 'http://localhost:3000'
      },
    ],
  },
  apis: ['./v1/auth/api-docs/*.docs.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };