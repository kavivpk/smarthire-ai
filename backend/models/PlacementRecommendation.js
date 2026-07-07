const mongoose = require('mongoose');

const placementRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Input scores (from existing reports)
  aptitudeScore: {
    type: Number,
    default: 0
  },
  codingScore: {
    type: Number,
    default: 0
  },
  technicalScore: {
    type: Number,
    default: 0
  },
  hrScore: {
    type: Number,
    default: 0
  },
  resumeScore: {
    type: Number,
    default: 0
  },
  // AI-generated outputs
  overallScore: {
    type: Number,
    default: 0
  },
  overallReadiness: {
    type: String,
    default: 'Not Evaluated'
  },
  recommendedRole: {
    type: String,
    default: ''
  },
  recommendedCompanies: {
    type: Array,
    default: []
  },
  strengths: {
    type: Array,
    default: []
  },
  weaknesses: {
    type: Array,
    default: []
  },
  skillsToImprove: {
    type: Array,
    default: []
  },
  learningRoadmap: {
    type: Array,
    default: []
  },
  estimatedPlacementChance: {
    type: Number,  // 0 – 100 (percentage)
    default: 0
  },
  aiSummary: {
    type: String,
    default: ''
  },
  createdByAI: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'PlacementRecommendation',
  placementRecommendationSchema,
  'PlacementRecommendations'
);
