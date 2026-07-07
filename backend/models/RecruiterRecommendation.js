const mongoose = require('mongoose');

const recruiterRecommendationSchema = new mongoose.Schema({
  // The candidate being evaluated
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // candidateId mirrors userId — retained as a separate field per spec
  // so recruiters can query by candidate without ambiguity
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Source report references (all optional — agent works with whatever is available)
  resumeReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeReport',
    default: null
  },
  codingReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingReport',
    default: null
  },
  technicalInterviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechnicalInterviewReport',
    default: null
  },
  hrInterviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HRInterviewReport',
    default: null
  },
  placementRecommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementRecommendation',
    default: null
  },

  // AI-generated scores (all 0–10)
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  technicalReadiness: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  communicationReadiness: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  cultureFit: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },

  // AI decision fields
  recommendation: {
    type: String,
    enum: ['Strong Hire', 'Hire', 'Maybe', 'Need Another Interview', 'Reject'],
    default: 'Maybe'
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },

  // Qualitative outputs
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  summary: {
    type: String,
    default: ''
  },

  createdByAI: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'RecruiterRecommendation',
  recruiterRecommendationSchema,
  'RecruiterRecommendations'
);
