const {
  generateRecruiterRecommendation,
  getLatestRecruiterRecommendation,
  getAllRecommendations
} = require('../services/recruiterAgentService');

// POST /api/recruiter/generate/:candidateId
// Admin or the candidate themselves can trigger this.
// Reads all existing reports, calls GROQ once, stores one RecruiterRecommendation.
const generate = async (req, res) => {
  try {
    // If candidateId param is "me", use the authenticated user's own id
    const candidateId =
      req.params.candidateId === 'me'
        ? req.user.id
        : req.params.candidateId;

    const result = await generateRecruiterRecommendation(candidateId);
    res.status(201).json(result);
  } catch (error) {
    console.error('[RecruiterAgent] generate error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// GET /api/recruiter/latest/:candidateId
// Returns the most recent recommendation for a candidate.
const getLatest = async (req, res) => {
  try {
    const candidateId =
      req.params.candidateId === 'me'
        ? req.user.id
        : req.params.candidateId;

    const result = await getLatestRecruiterRecommendation(candidateId);
    if (!result) {
      return res.status(404).json({
        message: 'No recruiter recommendation found. Generate one first.'
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/recruiter/all   (admin only)
// Lists the most recent recommendations across all candidates.
const getAll = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const results = await getAllRecommendations(limit);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generate, getLatest, getAll };
