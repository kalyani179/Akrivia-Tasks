const { s3Client } = require('../../aws/s3/s3');
const { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const knex = require('../../mysql/knex');

const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    console.log(req.user);
    const userId = req.user.userId;

    // Get username from users table
    const user = await knex('users')
      .select('username')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = user.username;
    const key = `${username}/${fileName}`;
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType
    };

    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.status(200).json({ uploadUrl, key });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ message: err.message });
  }
};

const downloadFiles = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get username from users table
    const user = await knex('users')
      .select('username')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = user.username;
    const fileNames = req.body.fileNames || [req.params.fileName];
    
    const downloadUrls = await Promise.all(
      fileNames.map(async (fileName) => {
        const key = `${username}/${fileName}`;
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });
        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { fileName, downloadUrl };
      })
    );

    const response = fileNames.length === 1 ? downloadUrls[0] : { downloadUrls };
    res.status(200).json(response);
  } catch (err) {
    console.error('Error generating download URL(s):', err);
    res.status(500).json({ message: err.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get username from users table
    const user = await knex('users')
      .select('username')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = user.username;
    const prefix = `${username}/`; // List only files with user's prefix

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: prefix
    });

    const data = await s3Client.send(command);
    
    // Filter out folders and map to include only necessary data
    const files = (data.Contents || [])
      .filter(item => item.Key !== prefix) // Remove the prefix folder itself
      .map(item => ({
        Key: item.Key,
        Size: item.Size,
        LastModified: item.LastModified
      }));

    res.status(200).json({ files });
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  generatePresignedUrl,
  downloadFiles,
  listFiles
};