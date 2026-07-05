const {
  getUserAnalytics,
  getWeeklyActivity,
  getRecentReports,
  getAdminAnalytics
} = require('../services/analyticsService');

// GET /api/analytics/summary
// Returns per-user aggregate analytics: averages, counts, placement readiness
const getSummary = async (req, res) => {
  try {
    const data = await getUserAnalytics(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

// GET /api/analytics/weekly
// Returns last 7 days of activity broken down by report type
const getWeekly = async (req, res) => {
  try {
    const data = await getWeeklyActivity(req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Analytics weekly error:', error);
    res.status(500).json({ message: 'Failed to fetch weekly activity', error: error.message });
  }
};

// GET /api/analytics/recent?limit=5
// Returns the most recent reports across all modules for this user
const getRecent = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const data = await getRecentReports(req.user.id, limit);
    res.json(data);
  } catch (error) {
    console.error('Analytics recent error:', error);
    res.status(500).json({ message: 'Failed to fetch recent reports', error: error.message });
  }
};

// GET /api/analytics/admin  (admin only)
// Returns platform-wide aggregates across all users
const getAdmin = async (req, res) => {
  try {
    const data = await getAdminAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Analytics admin error:', error);
    res.status(500).json({ message: 'Failed to fetch admin analytics', error: error.message });
  }
};

module.exports = { getSummary, getWeekly, getRecent, getAdmin };
