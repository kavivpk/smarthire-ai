const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generate, getLatest } = require('../controllers/placementRecommendationController');

// POST /api/placement-recommendation/generate
// Generates a new recommendation from all existing assessment reports
router.post('/generate', protect, generate);

// GET /api/placement-recommendation/latest
// Returns the most recent recommendation for the current user
router.get('/latest', protect, getLatest);

module.exports = router;
