/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    client: 'mysql2', // Use 'mysql2' for MySQL
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER, 
      password: process.env.DB_PASSWORD, 
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: './migrations', // Directory for migration files
      tableName: 'knex_migrations', // Table to track migrations
    },
    seeds: {
      directory: './seeds', // Directory for seed files
    }
};
