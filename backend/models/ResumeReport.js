const mongoose = require('mongoose');

const resumeReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  fileName: {
    type: String,
    default: ''
  },
  // Extracted content
  skills: {
    type: Array,
    default: []
  },
  missingSkills: {
    type: Array,
    default: []
  },
  projects: {
    type: Array,
    default: []
  },
  education: {
    type: Array,
    default: []
  },
  experience: {
    type: Array,
    default: []
  },
  certifications: {
    type: Array,
    default: []
  },
  // AI evaluation
  strengths: {
    type: Array,
    default: []
  },
  weaknesses: {
    type: Array,
    default: []
  },
  atsScore: {
    type: Number,
    default: 0
  },
  resumeScore: {
    type: Number,  // 0 – 100
    default: 0
  },
  recommendedRole: {
    type: String,
    default: ''
  },
  improvementSuggestions: {
    type: Array,
    default: []
  },
  overallFeedback: {
    type: String,
    default: ''
  },
  createdByAI: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'ResumeReport',
  resumeReportSchema,
  'ResumeReports'
);
