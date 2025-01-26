const { signupSchema, loginSchema } = require('./dto/auth.joi');
const bcrypt = require('bcrypt');
const knex = require('../../mysql/knex'); 
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../../middleware/jwt/jwt.middleware');
const { encrypt, decrypt } = require('../../constants/encrypt.decrypt');
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

    // Encrypt refresh token before storing
    const encryptedRefreshToken = encrypt(refreshToken, process.env.CRYPTO_SECRET_KEY);

    // Store encrypted refresh token in database
    await knex('users')
      .where({ id: user.id })
      .update({ refresh_token: encryptedRefreshToken });

    res.status(200).json({ 
      message: 'Login successful.', 
      accessToken,
      userId: user.id
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user and encrypted refresh token from database
    const user = await knex('users')
      .where({ id: userId })
      .select('refresh_token', 'username')
      .first();

    if (!user || !user.refresh_token) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    try {
      // Decrypt the stored refresh token
      const decryptedRefreshToken = decrypt(user.refresh_token, process.env.CRYPTO_SECRET_KEY);
      if (!decryptedRefreshToken) {
        throw new Error('Failed to decrypt refresh token');
      }

      // Verify the decrypted refresh token
      jwt.verify(decryptedRefreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Generate new access token
      const accessToken = generateAccessToken({ 
        userId: userId, 
        username: user.username 
      });

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken({ 
        userId: userId, 
        username: user.username 
      });

      // Encrypt new refresh token before storing
      const encryptedNewRefreshToken = encrypt(newRefreshToken, process.env.CRYPTO_SECRET_KEY);

      // Update encrypted refresh token in database
      await knex('users')
        .where({ id: userId })
        .update({ refresh_token: encryptedNewRefreshToken });

      res.json({ accessToken });
    } catch (err) {
      console.error('Token verification/decryption error:', err);
      
      // If refresh token is invalid, expired, or decryption fails
      await knex('users')
        .where({ id: userId })
        .update({ refresh_token: null });
        
      return res.status(401).json({ 
        error: 'Refresh token expired or invalid',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

const forgotPassword = async (req,res) => {
  try {
    const { email } = req.body;
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(400).json({error: "User has not signed up yet!"});
    }

    const accessToken = generateAccessToken({ userId: user.id, username: user.username });
 
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      debug: true
    });

    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Server connection error:', error);
        throw new Error('Email server connection failed');
      }
    });

    const link = `http://localhost:4200/reset-password/${user.id}/${accessToken}`;

    const mailOptions = {
      from: `"Password Reset" <${process.env.EMAIL}>`,
      to: email,
      subject: "Reset Your Password",
      text: "This Email is sent to Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Click the button below to reset your password:</p>
            <a href="${link}" 
             style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
          <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link in your browser:</p>
            <p>${link}</p>
          <p style="color: #666;">This link will expire in 15 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(link)
    return res.status(200).json({message: "Reset link sent successfully"});
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({error: "Failed to send reset email. Please try again later."});
  }
}

const resetPassword = async (req,res) => {
  try{
      let {password} =  req.body;
      let {id,accessToken} = req.params;
      const token = jwt.verify(accessToken,process.env.JWT_SECRET);
      if (!token) return res.status(400).send({ message: "This Email has expired!" });
      const hashedPassword = await bcrypt.hash(password, 10);
      await knex('users').where({ id }).update({ password: hashedPassword });
      return res.status(200).json({ message: "Password updated successfully" });
  }
  catch(err){
      console.log(err.message);
      return res.status(500).json({"error":"Internal Server Error"});
  }
}


module.exports = { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword,
  refreshAccessToken
};
