const express = require('express');
const router = express.Router();
const { generatePresignedUrl, downloadFiles,listFiles } = require('./files.controller');
const authenticateToken = require('../../middleware/jwt/jwt.middleware');

router.use(authenticateToken);

// Generate presigned URL for upload
router.post('/generate-upload-url',  generatePresignedUrl);

router.get('/list', listFiles); 

// Download multiple files
router.post('/download', downloadFiles);

module.exports = router;
