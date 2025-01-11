const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { upload } = require('./profile.utils');
const authenticateToken = require('../../middleware/jwt/jwt.middleware');

router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.patch('/update', profileController.updateProfile);
router.post('/upload-picture', upload.single('profilePicture'), profileController.updateProfilePicture);

module.exports = router;
