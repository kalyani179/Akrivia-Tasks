const {Model} = require('objection');
const Knex = require('knex');

const dotenv = require('dotenv');

dotenv.config();

// Initialize knex.
const knex = Knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
});

// Give the knex instance to objection.
Model.knex(knex);

module.exports = { knex };