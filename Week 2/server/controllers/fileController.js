const { s3Client } = require('../utils/aws-s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const File = require('../models/fileModel');
const { getUserById } = require('../models/userModel');


const generatePresignedUrl = async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      const userId = req.user.id; // Assuming you have user authentication and user ID is available in req.user
  
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${userId}/${Date.now()}_${fileName}`, // Unique file name with user ID
        ContentType: fileType
      };
  
      const command = new PutObjectCommand(params);
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
      res.status(200).json({ uploadUrl });
    } catch (err) {
      console.error('Error generating pre-signed URL:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

const saveFileMetadata = async (req, res) => {
  try {
    const { fileName, fileUrl } = req.body;
    const userId = req.user.id;

    const file = await File.query().insert({
      userId,
      fileName,
      fileUrl
    });

    res.status(201).json(file);
  } catch (err) {
    console.error('Error saving file metadata:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { generatePresignedUrl, saveFileMetadata };