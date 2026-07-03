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

    // Interview scores are stored as totalScore out of 10.
    // Keep a fallback for older documents that may have used "score".
    const interviews = await Interview.find({}, "totalScore score");
    const scoredInterviews = interviews
      .map((interview) => interview.totalScore ?? interview.score)
      .filter((score) => typeof score === "number" && Number.isFinite(score));

    const avgScore = scoredInterviews.length
      ? ((scoredInterviews.reduce((sum, score) => sum + score, 0) / scoredInterviews.length) * 10).toFixed(1)
      : "0.0";

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

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map(s => s._id);

    // Get Interview stats
    const interviewStats = await Interview.aggregate([
      { $match: { userId: { $in: studentIds } } },
      { $group: {
          _id: "$userId",
          interviewsTaken: { $sum: 1 },
          avgScore: { $avg: { $ifNull: ["$totalScore", "$score"] } }
      }}
    ]);

    // Get Resume stats (latest resume for each user)
    const resumes = await Resume.aggregate([
      { $match: { userId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: "$userId",
          resumeScore: { $first: "$atsScore" }
      }}
    ]);

    // Create maps for quick lookup
    const interviewMap = {};
    interviewStats.forEach(stat => {
      interviewMap[stat._id.toString()] = stat;
    });

    const resumeMap = {};
    resumes.forEach(stat => {
      resumeMap[stat._id.toString()] = stat;
    });

    // Merge data
    const enrichedStudents = students.map(student => {
      const iStat = interviewMap[student._id.toString()];
      const rStat = resumeMap[student._id.toString()];
      return {
        ...student,
        interviewsTaken: iStat ? iStat.interviewsTaken : 0,
        avgInterviewScore: iStat && iStat.avgScore != null ? (iStat.avgScore * 10).toFixed(1) + '%' : "N/A",
        resumeScore: rStat && rStat.resumeScore != null ? rStat.resumeScore + '%' : "N/A"
      };
    });

    res.json(enrichedStudents);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/admin/questions/aptitude
const addAptitudeQuestion = async (req, res) => {
  try {
    const { section, question, options, answer } = req.body;
    
    if (!section || !question || !options || options.length !== 4 || answer === undefined) {
      return res.status(400).json({ message: "All fields are required and options must be exactly 4." });
    }

    const AptitudeQuestion = require("../models/AptitudeQuestion");
    const newQuestion = await AptitudeQuestion.create({
      section,
      question,
      options,
      answer
    });

    res.status(201).json({ message: "Question added successfully", data: newQuestion });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getDashboardStats, getAllStudents, addAptitudeQuestion };
