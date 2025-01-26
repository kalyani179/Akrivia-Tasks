const Knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../knexfile'); // Adjust the path to your knexfile.js

// Initialize Knex
const knex = Knex(knexConfig);

// Bind Objection.js to the Knex instance
Model.knex(knex);

module.exports = knex;

