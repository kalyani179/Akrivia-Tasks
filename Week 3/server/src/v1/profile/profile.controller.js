const { s3Client } = require('../../aws/s3/s3');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const knex = require('../../mysql/knex');
const sharp = require('sharp');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await knex('users')
    .select('firstname','lastname','username', 'email', 'thumbnail')
    .where('id', userId)
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
    
    // Extract key from S3 URL more reliably
    const bucketUrlPrefix = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const key = decodeURIComponent(fileUrl.replace(bucketUrlPrefix, ''));

    // Get the original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });
    
    try {
      const originalImage = await s3Client.send(getCommand);
      const imageBuffer = await streamToBuffer(originalImage.Body);

      // Create thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(60, 60, {
          fit: 'cover',
          position: 'center'
        })
        .toBuffer();

      // Upload thumbnail to S3
      const thumbnailKey = `${userId}/thumbnails/${Date.now()}_thumb_${fileName}`;
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg'
      });

      await s3Client.send(uploadCommand);
      const thumbnailUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;

      // Update user record with both URLs
      await knex('users')
        .where({ id: userId })
        .update({
          profile_pic: fileUrl,
          thumbnail: thumbnailUrl,
          updated_at: knex.fn.now()
        });

      const updatedUser = await knex('users')
        .select('id', 'profile_pic', 'thumbnail')
        .where({ id: userId })
        .first();

      res.status(200).json(updatedUser);
    } catch (s3Error) {
      console.error('Error processing image:', s3Error);
      // If S3 operations fail, still update the user with original URL
      await knex('users')
        .where({ id: userId })
        .update({
          profile_pic: fileUrl,
          thumbnail: fileUrl, // Use original as thumbnail if processing fails
          updated_at: knex.fn.now()
        });

      const updatedUser = await knex('users')
        .select('id', 'profile_pic', 'thumbnail')
        .where({ id: userId })
        .first();

      res.status(200).json(updatedUser);
    }
  } catch (err) {
    console.error('Error saving profile picture:', err);
    res.status(500).json({ message: err.message });
  }
};

// Helper function to convert stream to buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

module.exports = {
  getProfile,
  generatePresignedUrl,
  saveFileMetadata
};
