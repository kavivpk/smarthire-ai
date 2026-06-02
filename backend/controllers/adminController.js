// backend/controllers/adminController.js

const User = require("../models/User");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalResumes  = await Resume.countDocuments();
    const totalInterviews = await Interview.countDocuments();

    // Interview scores average
    const interviews = await Interview.find({}, "score");
    const avgScore = interviews.length
      ? (interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length).toFixed(1)
      : 0;

    // Interviews per topic
    const topicStats = await Interview.aggregate([
      { $group: { _id: "$topic", count: { $sum: 1 } } }
    ]);

    // Registrations per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents,
      totalResumes,
      totalInterviews,
      avgScore,
      topicStats,
      dailyRegistrations
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getDashboardStats, getAllStudents };