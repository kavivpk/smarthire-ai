const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret } = req.body;

    if (role === 'admin') {
      const validSecret = process.env.ADMIN_SECRET || 'smarthire2024';
      if (adminSecret !== validSecret) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key' });
      }
    }

    // Already exists check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // User create
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    // JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User check
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Google-only account check
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };