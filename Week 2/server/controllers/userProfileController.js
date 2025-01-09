const dotenv = require('dotenv');
const { getPaginatedUsers, getUserById, updateUserById, deleteUserById } = require('../models/userModel');
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
    // console.log(user);
    return res.json(user);
  } 
  catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, gender, dob, course, email } = req.body;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await updateUserById(id, {
      username,
      gender,
      dob,
      course,
      email
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await deleteUserById(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getUsers, getProfile, updateUser, deleteUser };