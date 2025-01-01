const profileUpload = async(req,res) => {
    res.json(req.file);
}

module.exports = {profileUpload};