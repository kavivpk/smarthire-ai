const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema({
  input: String,
  expected: String,
  actual: String,
  status: { type: String, enum: ['Pass', 'Fail'] }
}, { _id: false });

const codingReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: Number,
    required: true
  },
  problemTitle: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  // Overall result
  score: {
    type: Number,  // 0 – 10
    default: 0
  },
  verdict: {
    type: String,  // e.g. 'Accepted', 'Wrong Answer', 'Compile Error'
    default: ''
  },
  // Test case summary
  testCasesPassed: {
    type: Number,
    default: 0
  },
  testCasesTotal: {
    type: Number,
    default: 0
  },
  testCaseResults: [testCaseResultSchema],
  // GROQ evaluation fields
  feedback: {
    type: String,
    default: ''
  },
  hints: {
    type: String,
    default: ''
  },
  timeComplexity: {
    type: String,
    default: ''
  },
  // Extended evaluation fields (populated when available)
  spaceComplexity: {
    type: String,
    default: ''
  },
  codeQuality: {
    type: Number,  // 0 – 10
    default: null
  },
  readability: {
    type: Number,  // 0 – 10
    default: null
  },
  optimization: {
    type: Number,  // 0 – 10
    default: null
  },
  edgeCases: {
    type: Number,  // 0 – 10
    default: null
  },
  bestPractices: {
    type: Number,  // 0 – 10
    default: null
  },
  strengths: {
    type: String,
    default: ''
  },
  weaknesses: {
    type: String,
    default: ''
  },
  recommendations: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'CodingReport',
  codingReportSchema,
  'coding_evaluation_reports'
);
