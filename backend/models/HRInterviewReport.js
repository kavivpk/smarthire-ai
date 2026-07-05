const mongoose = require('mongoose');

const hrInterviewReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewId: {
    type: String,
    required: true,
    index: true
  },
  interviewType: {
    type: String,
    default: 'HR'
  },
  questions: {
    type: Array,
    default: []
  },
  answers: {
    type: Array,
    default: []
  },
  aiFeedback: {
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
  // HR-specific scores
  communicationScore: {
    type: Number,
    default: 0
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  professionalismScore: {
    type: Number,
    default: 0
  },
  overallScore: {
    type: Number,
    default: 0
  },
  recommendation: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,  // seconds
    default: 0
  },
  createdByAI: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'HRInterviewReport',
  hrInterviewReportSchema,
  'HRInterviewReports'
);
