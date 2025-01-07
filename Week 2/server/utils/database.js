const {Model} = require('objection');
const Knex = require('knex');

const dotenv = require('dotenv');

dotenv.config();

// Initialize knex - creates a Knex instance that serves as the interface to interact with your database
// It provides methods for building and executing SQL queries
const knex = Knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
});

// Gives the Knex instance to Objection.js so that Objection can use it to interact with the database.
Model.knex(knex);

module.exports = { knex };