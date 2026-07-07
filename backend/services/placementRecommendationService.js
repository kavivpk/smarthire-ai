const mongoose = require('mongoose');
const CodingReport = require('../models/CodingReport');
const InterviewReport = require('../models/InterviewReport');
const HRInterviewReport = require('../models/HRInterviewReport');
const ResumeReport = require('../models/ResumeReport');
const Interview = require('../models/Interview');
const PlacementRecommendation = require('../models/PlacementRecommendation');
const User = require('../models/User');
const { sendPlacementRecommendationReport } = require('../utils/emailService');
const { notify } = require('./notificationService');

// ── Helper: safe average from array of docs ───────────────────────────────────
const safeAvg = (docs, field) => {
  const vals = docs.map(d => d[field]).filter(v => typeof v === 'number' && isFinite(v));
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
};

// ── Collect all report data for a user ───────────────────────────────────────
const collectUserScores = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [coding, technical, hr, resume, aptitude] = await Promise.all([
    CodingReport.find({ userId: uid }).select('score').lean(),
    InterviewReport.find({ userId: uid }).select('overallScore').lean(),
    HRInterviewReport.find({ userId: uid }).select('overallScore').lean(),
    ResumeReport.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(1)
      .select('atsScore skills missingSkills recommendedRole strengths weaknesses improvementSuggestions')
      .lean(),
    Interview.find({ userId: uid, topic: { $in: ['aptitude', 'Aptitude'] } })
      .select('totalScore')
      .lean()
  ]);

  return {
    codingScore: safeAvg(coding, 'score'),
    technicalScore: safeAvg(technical, 'overallScore'),
    hrScore: safeAvg(hr, 'overallScore'),
    resumeScore: safeAvg(resume, 'atsScore'),
    aptitudeScore: safeAvg(aptitude, 'totalScore'),
    latestResume: resume[0] || null
  };
};

// ── Call GROQ for AI recommendation ──────────────────────────────────────────
const generateAIRecommendation = async (scores) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return null;

  const { codingScore, technicalScore, hrScore, resumeScore, aptitudeScore, latestResume } = scores;

  const prompt = `You are a placement expert and career coach. Based on a student's assessment scores, generate a detailed placement recommendation.

Assessment Scores (all out of 10 unless noted):
- Aptitude: ${aptitudeScore}/10
- Coding: ${codingScore}/10
- Technical Interview: ${technicalScore}/10
- HR Interview: ${hrScore}/10
- Resume ATS Score: ${resumeScore}/100

Skills from Resume: ${(latestResume?.skills || []).join(', ') || 'Not available'}
Missing Skills: ${(latestResume?.missingSkills || []).join(', ') || 'None identified'}
Resume Recommended Role: ${latestResume?.recommendedRole || 'Not specified'}

Generate a comprehensive placement recommendation. Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "overallScore": 7.5,
  "overallReadiness": "Good",
  "recommendedRole": "Full Stack Developer",
  "recommendedCompanies": ["Mid-size product companies", "Service companies", "Startups"],
  "strengths": ["Strong technical skills", "Good communication"],
  "weaknesses": ["Needs improvement in algorithms", "Resume needs more projects"],
  "skillsToImprove": ["Data Structures", "System Design", "SQL"],
  "learningRoadmap": ["Complete DSA course", "Build 2 full-stack projects", "Practice mock interviews"],
  "estimatedPlacementChance": 72,
  "aiSummary": "2-3 sentence personalized summary of the student's placement readiness and key advice."
}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data.choices[0].message.content
      .trim()
      .replace(/```json?/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(raw);
  } catch (err) {
    console.error('GROQ placement recommendation failed:', err.message);
    return null;
  }
};

// ── Fallback recommendation without AI ───────────────────────────────────────
const buildFallbackRecommendation = (scores) => {
  const { codingScore, technicalScore, hrScore, resumeScore, aptitudeScore } = scores;
  const normalized = [codingScore, technicalScore, hrScore,
    resumeScore ? Math.round(resumeScore / 10 * 10) / 10 : 0,
    aptitudeScore
  ];
  const overallScore = Math.round(
    (normalized.reduce((s, v) => s + v, 0) / normalized.filter(v => v > 0).length || 1) * 10
  ) / 10;

  return {
    overallScore,
    overallReadiness: overallScore >= 7 ? 'Good' : overallScore >= 4 ? 'Average' : 'Needs Work',
    recommendedRole: scores.latestResume?.recommendedRole || 'Software Developer',
    recommendedCompanies: overallScore >= 7
      ? ['Product companies', 'Mid-size tech firms']
      : ['Service companies', 'Startups'],
    strengths: scores.latestResume?.strengths || [],
    weaknesses: scores.latestResume?.weaknesses || [],
    skillsToImprove: scores.latestResume?.missingSkills?.slice(0, 5) || [],
    learningRoadmap: scores.latestResume?.improvementSuggestions || [],
    estimatedPlacementChance: Math.min(Math.round(overallScore * 10), 95),
    aiSummary: `Based on your assessment scores, your overall placement readiness is ${overallScore}/10. Keep practising to improve your profile.`
  };
};

// ── Main: generate + save recommendation ─────────────────────────────────────
const generateAndSaveRecommendation = async (userId) => {
  const scores = await collectUserScores(userId);

  // Need at least one completed assessment to generate a recommendation
  const hasData = scores.codingScore > 0 || scores.technicalScore > 0 ||
    scores.hrScore > 0 || scores.resumeScore > 0 || scores.aptitudeScore > 0;

  if (!hasData) {
    return { message: 'No assessment data found. Complete at least one assessment first.' };
  }

  // Try AI recommendation, fall back to rule-based
  let aiResult = await generateAIRecommendation(scores);
  if (!aiResult) aiResult = buildFallbackRecommendation(scores);

  const recommendation = await PlacementRecommendation.create({
    userId,
    aptitudeScore: scores.aptitudeScore,
    codingScore: scores.codingScore,
    technicalScore: scores.technicalScore,
    hrScore: scores.hrScore,
    resumeScore: scores.resumeScore,
    overallScore: aiResult.overallScore || 0,
    overallReadiness: aiResult.overallReadiness || 'Not Evaluated',
    recommendedRole: aiResult.recommendedRole || '',
    recommendedCompanies: aiResult.recommendedCompanies || [],
    strengths: aiResult.strengths || [],
    weaknesses: aiResult.weaknesses || [],
    skillsToImprove: aiResult.skillsToImprove || [],
    learningRoadmap: aiResult.learningRoadmap || [],
    estimatedPlacementChance: aiResult.estimatedPlacementChance || 0,
    aiSummary: aiResult.aiSummary || '',
    createdByAI: true
  });

  // Notification — email + store history (fire-and-forget)
  notify(userId, {
    type: 'placement_recommendation',
    title: 'Placement Recommendation Generated',
    message: `Your placement readiness is ${aiResult.overallReadiness || 'evaluated'}. Estimated chance: ${aiResult.estimatedPlacementChance || 0}%. Role: ${aiResult.recommendedRole || 'N/A'}.`,
    emailFn: async () => {
      const user = await User.findById(userId).select('email name');
      if (user && user.email) {
        await sendPlacementRecommendationReport(user.email, user.name, {
          ...aiResult,
          aptitudeScore: scores.aptitudeScore,
          codingScore: scores.codingScore,
          technicalScore: scores.technicalScore,
          hrScore: scores.hrScore,
          resumeScore: scores.resumeScore
        });
      }
    }
  });

  return recommendation;
};

// ── Get the latest recommendation for a user ─────────────────────────────────
const getLatestRecommendation = async (userId) => {
  return PlacementRecommendation.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = { generateAndSaveRecommendation, getLatestRecommendation };
