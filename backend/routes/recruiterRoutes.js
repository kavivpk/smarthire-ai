const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { generate, getLatest, getAll } = require('../controllers/recruiterAgentController');

// POST /api/recruiter/generate/me         — student generates their own recommendation
// POST /api/recruiter/generate/:candidateId — admin generates for any candidate
router.post('/generate/:candidateId', protect, generate);

// GET /api/recruiter/latest/me
// GET /api/recruiter/latest/:candidateId  (admin)
router.get('/latest/:candidateId', protect, getLatest);

// GET /api/recruiter/all                  (admin only)
router.get('/all', protect, adminOnly, getAll);

module.exports = router;
