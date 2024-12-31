const { db } = require('../utils/dbUtils'); // Importing db from dbUtility.js

// Create user
const createUser = (username, email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Get user by email
const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Exporting functions
module.exports = { createUser, getUserByEmail };
