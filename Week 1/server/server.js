const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const CryptoJS = require('crypto-js');

const logger = require('./utilities/logger');
const morgan = require('morgan');

// Rate Limiting blocks user,bots or applications that are over-using or abusing a web property.
const rateLimit = require('express-rate-limit');

// Create the Express server
const server = express();
const PORT = 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});


const JWT_SECRET = 'kalyani@179';
const key = "kalyani";
const morganFormat = ":method :url :status :response-time ms";

// Middlewares
server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(limiter);
server.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

const encrypt = (data,key) => {
  const cipherText = CryptoJS.AES.encrypt(data, key).toString();
  return cipherText;
}

const decrypt = (cipherText,key) => {
  try{
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    if(bytes.sigBytes > 0){
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText;
    }
  }
  catch(err){
    throw new Error("Invalid key");
  }
}

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kalyani@179',
  database: 'auth_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the MySQL database.');
});


// Ensure database exists
db.query('CREATE DATABASE IF NOT EXISTS auth_db', (err) => {
  if (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  }
  console.log('Database exists or created successfully.');
});


// Create `users` table if it doesn't exist
const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
)`;

db.query(createUsersTable, (err) => {
  if (err) console.error('Error creating users table:', err);
});

// User registration
server.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Username or email already exists.' });
        }
        return res.status(500).json({ message: 'Database error.', error: err });
      }
      res.status(201).json({ message: 'User registered successfully.' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err });
  }
});

// User login
server.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.', error: err });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'Login successful.', token });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
