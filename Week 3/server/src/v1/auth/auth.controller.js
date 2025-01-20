const { signupSchema, loginSchema } = require('./dto/auth.joi');
const bcrypt = require('bcrypt');
const knex = require('../../mysql/knex'); // Adjust the path to your Knex instance
const dotenv = require('dotenv');
const { generateAccessToken, generateRefreshToken } = require('../../middleware/jwt/jwt.middleware');
dotenv.config({ path: '../../.env' });


const generateUsername = async (firstname, lastname) => {
  try {
    // Clean and normalize the input
    firstname = firstname.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    lastname = lastname.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // Different username patterns to try
    const patterns = [
      // Pattern 1: firstnamelastname
      `${firstname}${lastname}`,
      // Pattern 2: firstname.lastname
      `${firstname}.${lastname}`,
      // Pattern 3: firstnameL
      `${firstname}${lastname.charAt(0)}`,
      // Pattern 4: first4last4
      `${firstname.slice(0, 4)}${lastname.slice(0, 4)}`,
      // Pattern 5: flastname (first letter + lastname)
      `${firstname.charAt(0)}${lastname}`
    ];

    // Try each pattern first without numbers
    for (const pattern of patterns) {
      const exists = await knex('users').where({ username: pattern }).first();
      if (!exists) {
        return pattern;
      }
    }

    // If all patterns are taken, try with random numbers
    const randomPattern = patterns[0]; // Use first pattern as base
    let username;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate a random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      username = `${randomPattern}${randomNum}`;
      
      const exists = await knex('users').where({ username }).first();
      if (!exists) {
        return username;
      }
      
      attempts++;
    }

    // If still no unique username, use timestamp
    const timestamp = Date.now().toString().slice(-4);
    username = `${randomPattern}${timestamp}`;
    
    // Final check
    const finalExists = await knex('users').where({ username }).first();
    if (finalExists) {
      // Last resort: Add full timestamp
      username = `${randomPattern}${Date.now()}`;
    }

    return username;
  } catch (err) {
    console.error('Error generating username:', err);
    throw new Error('Failed to generate username');
  }
};
  
const signup = async (req, res) => {
    // Validate request body using Joi
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    const { firstname, lastname, email, password } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await knex('users').where({ email }).first();
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Generate a unique username
      const username = await generateUsername(firstname, lastname);
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert the new user
      await knex('users').insert({
        firstname: firstname,
        lastname,
        username, 
        email,
        password: hashedPassword,
        status: 0, // Default status
      });
  
      res.status(201).json({ message: 'User created successfully', username });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};
  

const login = async (req, res) => {
  // Validate request body using Joi
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ userId: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ userId: user.id, username: user.username });

    res.status(200).json({ message: 'Login successful.', accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login };
