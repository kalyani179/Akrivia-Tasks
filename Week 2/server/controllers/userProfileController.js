const { getPaginatedUsers, getUserById } = require('../models/userModel');

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

    console.log('User Profile:', user);
    return res.json(user);
  } 
  catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const profileUpload = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.$query().patch({ profileImage: image });

    console.log('Uploaded image:', image);
    res.status(200).json({ message: 'Image uploaded successfully', image });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getUsers, getProfile, profileUpload };