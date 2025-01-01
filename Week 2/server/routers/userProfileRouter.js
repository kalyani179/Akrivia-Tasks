const express = require('express');
const router = express.Router();

const authenticateToken = require('../utils/jwtUtils');
const { profileUpload } = require('../controllers/userProfileController');
const upload = require('../utils/multerUtils');

router.post('/upload',upload.single('avatar'),profileUpload);

module.exports = router;