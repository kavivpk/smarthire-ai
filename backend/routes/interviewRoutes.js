const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionsFromSkills,
  submitInterview,
  getHistory,
  generateAptitude,
  submitAptitude,
  evaluateCode,
  getCodingProblems,
  saveInterviewSession,
} = require('../controllers/interviewController');
const {
  evaluateInterviewAnswer,
  completeTechnicalInterview,
  getTechnicalInterviewStats,
  getCodingStats
} = require('../controllers/interviewEvaluationController');
const { protect } = require('../middleware/authMiddleware');
const { sendRoomInvite } = require('../utils/emailService');
const User = require('../models/User');

router.get('/questions/:topic', protect, getQuestions);
router.post('/questions/from-skills', protect, getQuestionsFromSkills);
router.post('/submit', protect, submitInterview);
router.get('/history', protect, getHistory);
router.post('/aptitude', protect, generateAptitude);
router.post('/aptitude/submit', protect, submitAptitude);
router.post('/evaluate-code', protect, evaluateCode);
router.get('/coding-problems', protect, getCodingProblems);
router.post('/evaluate', protect, evaluateInterviewAnswer);
router.post('/evaluate/complete', protect, completeTechnicalInterview);
router.get('/technical-stats', protect, getTechnicalInterviewStats);
router.get('/coding-stats', protect, getCodingStats);
router.post('/session/save', protect, saveInterviewSession);

// Test combined email — call this to verify email is working
router.post('/test-combined-email', protect, async (req, res) => {
  try {
    const { sendCombinedAIInterviewResult } = require('../utils/emailService');
    const user = await User.findById(req.user.id).select('email name');
    if (!user || !user.email) {
      return res.status(400).json({ message: 'No email found for user' });
    }
    console.log('Sending test combined email to:', user.email);
    await sendCombinedAIInterviewResult(user.email, user.name, {
      aptitude:  { correct: 10, total: 75, totalScore: 53, categoryScores: { Analytical: { correct: 2, total: 15 } } },
      coding:    { avgScore: 7, results: [{ title: 'Reverse String', score: 7 }] },
      technical: { overallScore: 6 },
      overall:   { score: 85, outOf: 150, percent: 57 },
      violations: 0,
      disqualified: false,
    });
    console.log('Test combined email sent to:', user.email);
    res.json({ message: `Test email sent to ${user.email}` });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ message: 'Failed to send test email', error: err.message });
  }
});

// Send room invite email
router.post('/send-invite', protect, async (req, res) => {
  try {
    const { toEmail, roomId, studentName } = req.body;

    if (!toEmail || !roomId) {
      return res.status(400).json({ message: 'Email and room ID are required' });
    }

    const inviter = await User.findById(req.user.id).select('name email');

    await sendRoomInvite(
      toEmail,
      roomId,
      studentName || toEmail,
      inviter?.name || inviter?.email || 'Interviewer'
    );

    res.json({ message: 'Invitation sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = router;
