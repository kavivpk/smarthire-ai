const mongoose = require('mongoose');

const aptitudeQuestionSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['Analytical', 'Logical', 'Technical', 'General'],
    default: 'General'
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  answer: {
    type: Number,
    required: true, // index of the correct option (0-3)
    min: 0,
    max: 3
  }
}, { timestamps: true });

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
