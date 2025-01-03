const express = require('express');
const router = express.Router();

const authenticateToken = require('../utils/jwtUtils');
const { profileUpload, getProfile, getUsers } = require('../controllers/userProfileController');
const upload = require('../middlewares/multer');

router.get('/user',authenticateToken,getProfile);
router.get('/users',authenticateToken,getUsers);
router.post('/upload',authenticateToken,upload.single('avatar'),profileUpload);

module.exports = router;