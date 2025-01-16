const { s3Client } = require('../../aws/s3/s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const knex = require('../../mysql/knex');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await knex('users')
    .select('firstname','lastname','username', 'email', 'thumbnail')
    .where('user_id', userId)
    .first();
    if (!profile) {
      throw new Error('User not found');
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const userId = req.user.userId; 

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${userId}/${Date.now()}_${fileName}`,
      ContentType: fileType
    };

    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ message: err.message });
  }
};

const saveFileMetadata = async (req, res) => {
  try {
    const { fileName, fileUrl } = req.body;
    const userId = req.user.userId;

    // Update the user's profile_pic and thumbnail in the users table
    await knex('users')
      .where({ user_id: userId })
      .update({
        profile_pic: fileUrl,
        thumbnail: fileUrl, // Using same URL for thumbnail for now
        updated_at: knex.fn.now()
      });

    // Fetch the updated user data
    const updatedUser = await knex('users')
      .select('user_id', 'profile_pic', 'thumbnail')
      .where({ user_id: userId })
      .first();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error saving profile picture:', err);
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  getProfile,
  generatePresignedUrl,
  saveFileMetadata
};
