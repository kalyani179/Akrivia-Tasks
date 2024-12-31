const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// MySQL connection details from environment variables
const userDB = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL and ensure database exists
userDB.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message); // Log full error message
    process.exit(1); // Exit if connection fails
  }
  console.log('Connected to the MySQL database.');

  // Ensure database exists
  userDB.query('CREATE DATABASE IF NOT EXISTS auth_db', (err) => {
    if (err) {
      console.error('Error creating database:', err.message);
      process.exit(1); // Exit if there’s an error creating the database
    }
    console.log('Database exists or created successfully.');

    // Select the database
    userDB.changeUser({ database: 'auth_db' }, (err) => {
      if (err) {
        console.error('Error selecting database:', err.message);
        process.exit(1);
      }
      console.log('Database selected successfully.');

      // Create users table if it doesn't exist
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL
        )
      `;

      userDB.query(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table created or already exists.');
        }
      });
    });
  });
});

module.exports = { userDB };
