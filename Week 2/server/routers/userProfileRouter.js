const express = require('express');
const router = express.Router();

const authenticateToken = require('../utils/jwtUtils');
const { profileUpload } = require('../controllers/userProfileController');
const upload = require('../middlewares/multer');

router.post('/upload',authenticateToken,upload.single('avatar'),profileUpload);

module.exports = router;