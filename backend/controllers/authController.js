const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CodingReport = require('../models/CodingReport');
const InterviewReport = require('../models/InterviewReport');
const HRInterviewReport = require('../models/HRInterviewReport');
const ResumeReport = require('../models/ResumeReport');
const { sendLoginSummary } = require('../utils/emailService');

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
      { id: user._id, role: user.role, email: user.email, name: user.name },
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
      { id: user._id, role: user.role, email: user.email, name: user.name },
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

    // Send login summary email (fire-and-forget, never blocks login)
    if (user.role === 'student') {
      const uid = user._id;
      Promise.all([
        CodingReport.find({ userId: uid }).select('score').lean(),
        InterviewReport.find({ userId: uid }).select('overallScore').lean(),
        HRInterviewReport.find({ userId: uid }).select('overallScore').lean(),
        ResumeReport.find({ userId: uid }).select('atsScore recommendedRole').lean()
      ])
        .then(([coding, technical, hr, resumes]) => {
          const avg = (arr, field) => {
            const vals = arr.map(d => d[field]).filter(v => typeof v === 'number');
            return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
          };

          const codingScore = avg(coding, 'score');
          const technicalScore = avg(technical, 'overallScore');
          const hrScore = avg(hr, 'overallScore');
          const resumeScore = avg(resumes, 'atsScore');
          const latestResume = resumes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

          // Compute overall readiness (0-10 scale, skip missing modules)
          const scores = [codingScore, technicalScore, hrScore,
            resumeScore !== null ? Math.round(resumeScore / 10 * 10) / 10 : null
          ].filter(s => s !== null);
          const overallReadiness = scores.length
            ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
            : null;

          return sendLoginSummary(user.email, user.name, {
            codingScore,
            technicalScore,
            hrScore,
            resumeScore,
            aptitudeScore: null,
            overallReadiness,
            recommendedRole: latestResume?.recommendedRole || ''
          });
        })
        .catch(err => console.error('Failed to send login summary email:', err));
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };