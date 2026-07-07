const {
  generateAndSaveRecommendation,
  getLatestRecommendation
} = require('../services/placementRecommendationService');

// POST /api/placement-recommendation/generate
// Generates a new AI placement recommendation from all existing reports
const generate = async (req, res) => {
  try {
    const result = await generateAndSaveRecommendation(req.user.id);

    if (result?.message) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Placement recommendation generation failed:', error);
    res.status(500).json({
      message: 'Failed to generate placement recommendation',
      error: error.message
    });
  }
};

// GET /api/placement-recommendation/latest
// Returns the most recent recommendation for the authenticated user
const getLatest = async (req, res) => {
  try {
    const recommendation = await getLatestRecommendation(req.user.id);

    if (!recommendation) {
      return res.status(404).json({
        message: 'No recommendation found. Please generate one first.'
      });
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Failed to fetch placement recommendation:', error);
    res.status(500).json({
      message: 'Failed to fetch placement recommendation',
      error: error.message
    });
  }
};

module.exports = { generate, getLatest };
