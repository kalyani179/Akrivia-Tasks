const knex = require('../../mysql/knex');
const fs = require('fs').promises;

const getProfile = async (userId) => {
  try {
    const user = await knex('users')
      .select('username', 'email', 'thumbnail')
      .where('user_id', userId)
      .first();

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateProfile = async (userId, profileData) => {
  try {
    const [updated] = await knex('users')
      .where('user_id', userId)
      .update({
        username: profileData.username,
        email: profileData.email,
        updated_at: knex.fn.now()
      })
      .returning(['username', 'email', 'thumbnail']);

    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateProfilePicture = async (userId, file) => {
  try {
    // Get old profile picture if exists
    const oldUser = await knex('users')
      .select('profile_pic', 'thumbnail')
      .where('user_id', userId)
      .first();

    // Update with new picture
    const [updated] = await knex('users')
      .where('user_id', userId)
      .update({
        profile_pic: file.filename,
        thumbnail: file.filename, // You might want to generate an actual thumbnail
        updated_at: knex.fn.now()
      })
      .returning(['user_id', 'profile_pic', 'thumbnail']);

    // Delete old files if they exist
    if (oldUser?.profile_pic) {
      try {
        await fs.unlink(`uploads/profile-pictures/${oldUser.profile_pic}`);
        if (oldUser.thumbnail) {
          await fs.unlink(`uploads/thumbnails/${oldUser.thumbnail}`);
        }
      } catch (err) {
        console.error('Error deleting old profile pictures:', err);
      }
    }

    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePicture
};
