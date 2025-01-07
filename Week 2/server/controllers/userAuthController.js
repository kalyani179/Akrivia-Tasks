const bcrypt = require('bcrypt');
const { createUser, getUserByEmail } = require('../models/userModel'); 

const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');

const register = async (req, res) => {
  const { username, gender, dob, course, email, password } = req.body;

  if (!username || !email || !password || !dob || !gender || !course) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters' });
  }

  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordPattern.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, with a minimum length of 8 characters.' });
  }

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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

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