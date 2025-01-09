const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../utils/jwtUtils');
const { generatePresignedUrl, saveFileMetadata } = require('../controllers/fileController');

router.post('/generate-presigned-url', authenticateToken, generatePresignedUrl);
router.post('/save-file-metadata', authenticateToken,saveFileMetadata);

module.exports = router;