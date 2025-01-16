const { signupSchema, loginSchema } = require('./dto/auth.joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../../mysql/knex'); // Adjust the path to your Knex instance
const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' });

const JWT_SECRET = process.env.JWT_SECRET;

const generateUsername = async (firstname, lastname) => {
    let baseUsername = `${firstname.toLowerCase()}${lastname.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
  
    try {
      // Check if the username is unique
      while (true) {
        const existingUser = await knex('users').where({ username }).first();
        
        if (!existingUser) {
          break; 
        }
  
        // Append a counter to make it unique
        username = `${baseUsername}${counter}`;
        counter++;
      }
  
      return username;
    } catch (err) {
      throw new Error('Internal server error');
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

    // Generate a JWT token
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(200).json({ 
      token,
      message: 'Login successful'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login };
