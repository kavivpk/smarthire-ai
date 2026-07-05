const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getSummary, getWeekly, getRecent, getAdmin } = require('../controllers/analyticsController');

// Per-user routes (any authenticated user)
router.get('/summary', protect, getSummary);
router.get('/weekly', protect, getWeekly);
router.get('/recent', protect, getRecent);

// Admin-only platform-wide route
router.get('/admin', protect, adminOnly, getAdmin);

module.exports = router;
