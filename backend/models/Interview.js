const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: String,
  questions: [{
    question: String,
    userAnswer: String,
    score: Number,
    feedback: String
  }],
  totalScore: Number,
  totalQuestions: Number,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);