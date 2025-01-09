const bcrypt = require('bcrypt');
const { createUser, getUserByEmail } = require('../models/userModel'); 
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const register = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, gender, dob, course, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // sets 10 rounds the algorithm uses
    const result = await createUser(username, email, hashedPassword, dob, gender, course); 
    res.status(201).json({ message: 'User registered successfully.'});
  } catch (err) {
    if (err.nativeError && err.nativeError.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    res.status(500).json({ message: 'Server error.', error: err.message });
  }  
};

const login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email); 

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); // rehashes the password and compare 

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username });

    res.status(200).json({ message: 'Login successful.', accessToken, refreshToken });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login };