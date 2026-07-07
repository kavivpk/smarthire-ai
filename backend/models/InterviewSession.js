const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    aptitudeResult: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      categoryScores: { type: Map, of: Object, default: {} }
    },
    codingResult: {
      solved: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
      results: { type: Array, default: [] }
    },
    technicalResult: {
      overallScore: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 }
    },
    overallScore: {
      score: { type: Number, default: 0 },
      outOf: { type: Number, default: 90 },
      percent: { type: Number, default: 0 }
    },
    violations: { type: Number, default: 0 },
    disqualified: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
