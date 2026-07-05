// backend/routes/adminRoutes.js

// const express = require("express");
// const router  = express.Router();
// const { protect, adminOnly } = require("../middleware/authMiddleware");
// const { getDashboardStats, getAllStudents, addAptitudeQuestion } = require("../controllers/adminController");

// router.get("/stats",    protect, adminOnly, getDashboardStats);
// router.get("/students", protect, adminOnly, getAllStudents);
// router.post("/questions/aptitude", protect, adminOnly, addAptitudeQuestion);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');

// All students list
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalResumes = await Resume.countDocuments();
    const totalInterviews = await Interview.countDocuments();

    // Average ATS score
    const resumeScores = await Resume.find().select('atsScore');
    const avgATS = resumeScores.length > 0
      ? Math.round(resumeScores.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumeScores.length)
      : 0;

    // Average interview score
    const interviewScores = await Interview.find().select('totalScore');
    const avgInterview = interviewScores.length > 0
  ? Math.round(interviewScores.reduce((sum, i) => sum + (i.totalScore || 0), 0) / interviewScores.length)
  : 0;

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'student' } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Topic-wise interview distribution
    const topicData = await Interview.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ATS score distribution
    const atsDistribution = await Resume.aggregate([
      {
        $bucket: {
          groupBy: '$atsScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    res.json({
      totalStudents,
      totalResumes,
      totalInterviews,
      avgATS,
      avgInterview,
      monthlyData,
      topicData,
      atsDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student detail
router.get('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    const resumes = await Resume.find({ userId: req.params.id }).sort({ createdAt: -1 });
    const interviews = await Interview.find({ userId: req.params.id }).sort({ createdAt: -1 });

    res.json({ student, resumes, interviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;