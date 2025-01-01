const multer = require('multer');
const path = require('path');
const uploadPath = path.join(__dirname, '../uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
const upload = multer({ storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
 });

module.exports = upload;

