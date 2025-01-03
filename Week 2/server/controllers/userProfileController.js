const { db } = require("../utils/dbUtils");

const getUsers = (req, res) => {
  const page = parseInt(req.query.page, 10) || 1; // Default to page 1
  const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 users per page
  const offset = (page - 1) * limit;

  db.query('SELECT * FROM users LIMIT ? OFFSET ?', [limit, offset], (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    db.query('SELECT COUNT(*) as total FROM users', (countErr, countResults) => {
      if (countErr) {
        console.error('Error counting users:', countErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const total = countResults[0].total;
      res.json({
        users: results,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    });
  });
};


const getProfile = (req, res) => {
    
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    console.log('User ID:', userId); 
    
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('User Profile:', results);
      return res.json(results[0]);
    });
};


const profileUpload = async(req,res) => {
    res.json(req.file);
}

module.exports = { getUsers,getProfile,profileUpload };