const dotenv = require('dotenv');
const { getPaginatedUsers, getUserById } = require('../models/userModel');
dotenv.config();

const getUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1; 
  const limit = parseInt(req.query.limit, 10) || 10; 

  try {
    const { users, total } = await getPaginatedUsers(page, limit);
    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } 
  catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const userId = req.user.id;
  console.log('User ID:', userId);

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } 
  catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { getUsers, getProfile };