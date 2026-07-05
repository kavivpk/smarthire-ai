const mongoose = require('mongoose');

const interviewReportSchema = new mongoose.Schema({
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
    default: 'Technical'
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
  technicalScore: {
    type: Number,
    default: 0
  },
  problemSolvingScore: {
    type: Number,
    default: 0
  },
  communicationScore: {
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
  'InterviewReport',
  interviewReportSchema,
  'InterviewReports'
);
