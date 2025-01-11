const profileService = require('./profile.service');
const { validateProfileUpdate } = require('./dto/profile.joi');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await profileService.getProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { error, value } = validateProfileUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user.userId;
    const updatedProfile = await profileService.updateProfile(userId, value);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const updatedProfile = await profileService.updateProfilePicture(userId, req.file);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePicture
};
