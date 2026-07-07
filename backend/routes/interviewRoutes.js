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
