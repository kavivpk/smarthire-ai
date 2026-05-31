const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  extractedText: String,
  atsScore: Number,
  matchedSkills: [String],
  missingSkills: [String],
  suggestions: [String],
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);