const mongoose = require('mongoose');

const technicalInterviewReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  technicalScore: Number,
  communicationScore: Number,
  grammarScore: Number,
  confidenceScore: Number,
  keywordScore: Number,
  overallScore: Number,
  feedback: String,
  strength: String,
  weakness: String,
  recommendation: String
}, { timestamps: true });

module.exports = mongoose.model(
  'TechnicalInterviewReport',
  technicalInterviewReportSchema,
  'technical_interview_reports'
);
