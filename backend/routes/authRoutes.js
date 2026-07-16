const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', register);
router.post('/login', login);

// Protected route — token venum
router.get('/me', protect, (req, res) => {
  res.json({ message: 'Protected route working!', user: req.user });
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, photoURL } = req.body;

    // User already exists check
    let user = await User.findOne({ email });

    if (!user) {
      // New user create pannunga
      user = await User.create({
        name,
        email,
        password: googleId, // Google users need no password
        role: 'student',
        googleId,
        photoURL
      });
    }

    // JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Google auth failed', error: error.message });
  }
});
module.exports = router;