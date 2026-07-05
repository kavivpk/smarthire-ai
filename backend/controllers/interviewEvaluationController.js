const TechnicalInterviewReport = require('../models/TechnicalInterviewReport');
const InterviewReport = require('../models/InterviewReport');
const CodingReport = require('../models/CodingReport');
const User = require('../models/User');
const {
  evaluateTechnicalAnswer,
  summarizeTechnicalInterview
} = require('../services/interviewEvaluationService');
const { sendTechnicalInterviewReport } = require('../utils/emailService');

const normalizeScore = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(10, Math.round(number * 10) / 10));
};

const evaluateInterviewAnswer = async (req, res) => {
  try {
    const { question, answer, resume, interviewId, keywords, expectedAnswer } = req.body;

    if (!question || !answer || !interviewId) {
      return res.status(400).json({
        message: 'question, answer, and interviewId are required'
      });
    }

    const evaluation = await evaluateTechnicalAnswer({
      question,
      answer,
      resume,
      interviewId,
      userId: req.user.id,
      keywords: Array.isArray(keywords) ? keywords : [],
      expectedAnswer
    });

    const report = await TechnicalInterviewReport.create({
      userId: req.user.id,
      interviewId,
      question,
      answer,
      technicalScore: normalizeScore(evaluation.technicalScore),
      communicationScore: normalizeScore(evaluation.communicationScore),
      grammarScore: normalizeScore(evaluation.grammarScore),
      confidenceScore: normalizeScore(evaluation.confidenceScore),
      keywordScore: normalizeScore(evaluation.keywordScore),
      overallScore: normalizeScore(evaluation.overallScore),
      feedback: evaluation.feedback || '',
      strength: evaluation.strength || '',
      weakness: evaluation.weakness || '',
      recommendation: evaluation.recommendation || ''
    });

    res.status(201).json({
      reportId: report._id,
      interviewId: report.interviewId,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      grammarScore: report.grammarScore,
      confidenceScore: report.confidenceScore,
      keywordScore: report.keywordScore,
      keywordMatch: evaluation.keywordMatch || Math.round(report.keywordScore * 10),
      overallScore: report.overallScore,
      feedback: report.feedback,
      strength: report.strength,
      weakness: report.weakness,
      recommendation: report.recommendation,
      matchedKeywords: evaluation.matchedKeywords || [],
      missingKeywords: evaluation.missingKeywords || []
    });
  } catch (error) {
    console.error('Technical interview evaluation failed:', error);
    res.status(500).json({
      message: 'Technical interview evaluation failed',
      error: error.message
    });
  }
};

const completeTechnicalInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: 'interviewId is required' });
    }

    const reports = await TechnicalInterviewReport.find({
      userId: req.user.id,
      interviewId
    }).sort({ createdAt: 1 });

    const evaluations = reports.map(report => ({
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      grammarScore: report.grammarScore,
      confidenceScore: report.confidenceScore,
      keywordScore: report.keywordScore,
      overallScore: report.overallScore
    }));

    const summary = await summarizeTechnicalInterview(evaluations);

    User.findById(req.user.id)
      .then(user => {
        if (user && user.email && reports.length > 0) {
          return sendTechnicalInterviewReport(user.email, user.name, {
            ...summary,
            reports
          });
        }
        return null;
      })
      .catch(error => console.error('Failed to send technical interview report email:', error));

    res.json({
      interviewId,
      totalQuestions: reports.length,
      summary,
      reports
    });

    // Persist a consolidated InterviewReport for this session (fire-and-forget)
    if (reports.length > 0) {
      const avg = (field) =>
        Math.round(
          (reports.reduce((sum, r) => sum + (r[field] || 0), 0) / reports.length) * 10
        ) / 10;

      InterviewReport.create({
        userId: req.user.id,
        interviewId,
        interviewType: 'Technical',
        questions: reports.map(r => r.question),
        answers: reports.map(r => r.answer),
        aiFeedback: reports.map(r => r.feedback).filter(Boolean),
        strengths: reports.map(r => r.strength).filter(Boolean),
        weaknesses: reports.map(r => r.weakness).filter(Boolean),
        technicalScore: avg('technicalScore'),
        problemSolvingScore: avg('technicalScore'), // best available proxy
        communicationScore: avg('communicationScore'),
        overallScore: avg('overallScore'),
        recommendation: summary.recommendations
          ? (Array.isArray(summary.recommendations)
              ? summary.recommendations.join(' ')
              : summary.recommendations)
          : '',
        duration: 0,
        createdByAI: true
      }).catch(err => console.error('Failed to save InterviewReport:', err));
    }
  } catch (error) {
    console.error('Technical interview completion failed:', error);
    res.status(500).json({
      message: 'Technical interview completion failed',
      error: error.message
    });
  }
};

const getTechnicalInterviewStats = async (req, res) => {
  try {
    const reports = await TechnicalInterviewReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const interviewMap = new Map();
    reports.forEach(report => {
      if (!interviewMap.has(report.interviewId)) {
        interviewMap.set(report.interviewId, []);
      }
      interviewMap.get(report.interviewId).push(report);
    });

    const interviews = Array.from(interviewMap.entries()).map(([interviewId, items]) => {
      const average = items.reduce((sum, item) => sum + (item.overallScore || 0), 0) / items.length;
      const lastDate = items.reduce((latest, item) => (
        new Date(item.createdAt) > new Date(latest) ? item.createdAt : latest
      ), items[0].createdAt);

      return {
        interviewId,
        overallScore: Math.round(average * 10) / 10,
        questionCount: items.length,
        lastInterviewDate: lastDate
      };
    }).sort((a, b) => new Date(b.lastInterviewDate) - new Date(a.lastInterviewDate));

    const averageScore = interviews.length
      ? Math.round((interviews.reduce((sum, item) => sum + item.overallScore, 0) / interviews.length) * 10) / 10
      : 0;

    res.json({
      recent: interviews[0] || null,
      averageScore,
      totalInterviews: interviews.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch technical interview stats',
      error: error.message
    });
  }
};

const getCodingStats = async (req, res) => {
  try {
    const reports = await CodingReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      return res.json({ recent: null, averageScore: 0, totalTests: 0 });
    }

    const averageScore =
      Math.round(
        (reports.reduce((sum, r) => sum + (r.score || 0), 0) / reports.length) * 10
      ) / 10;

    const recent = reports[0];

    res.json({
      recent: {
        problemTitle: recent.problemTitle,
        language: recent.language,
        score: recent.score,
        verdict: recent.verdict,
        testCasesPassed: recent.testCasesPassed,
        testCasesTotal: recent.testCasesTotal,
        lastSubmissionDate: recent.createdAt
      },
      averageScore,
      totalTests: reports.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch coding stats',
      error: error.message
    });
  }
};

module.exports = {
  evaluateInterviewAnswer,
  completeTechnicalInterview,
  getTechnicalInterviewStats,
  getCodingStats
};
