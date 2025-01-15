const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const authenticateToken = require('../../middleware/jwt/jwt.middleware');

require('./api-docs/profile.docs');

router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.post('/generate-presigned-url', profileController.generatePresignedUrl);
router.post('/save-file-metadata',  profileController.saveFileMetadata);

module.exports = router;
