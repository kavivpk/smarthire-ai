const express = require('express');
const router = express.Router();
const { getQuestions, submitInterview, getHistory } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/questions/:topic', protect, getQuestions);
router.post('/submit', protect, submitInterview);
router.get('/history', protect, getHistory);

module.exports = router;