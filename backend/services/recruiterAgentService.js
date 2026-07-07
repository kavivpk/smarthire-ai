/**
 * Recruiter AI Agent Service
 *
 * Reads all previously generated reports for a candidate,
 * sends a consolidated prompt to GROQ, and saves one
 * RecruiterRecommendation document to MongoDB.
 *
 * No existing reports are regenerated or modified.
 */

const mongoose = require('mongoose');
const ResumeReport         = require('../models/ResumeReport');
const CodingReport         = require('../models/CodingReport');
const TechnicalInterviewReport = require('../models/TechnicalInterviewReport');
const HRInterviewReport    = require('../models/HRInterviewReport');
const PlacementRecommendation  = require('../models/PlacementRecommendation');
const RecruiterRecommendation  = require('../models/RecruiterRecommendation');

// ── helpers ───────────────────────────────────────────────────────────────────

const safeAvg = (docs, field) => {
  const vals = docs.map(d => d[field]).filter(v => typeof v === 'number' && isFinite(v));
  return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
};

/**
 * Collect the most recent document of each report type for a given userId.
 * Returns a plain object with all data needed to build the GROQ prompt.
 */
const collectCandidateData = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [
    resumeReports,
    codingReports,
    techReports,
    hrReports,
    placementRecs
  ] = await Promise.all([
    ResumeReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(1).lean(),
    CodingReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
    TechnicalInterviewReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
    HRInterviewReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(1).lean(),
    PlacementRecommendation.find({ userId: uid }).sort({ createdAt: -1 }).limit(1).lean()
  ]);

  const resume    = resumeReports[0]    || null;
  const hr        = hrReports[0]        || null;
  const placement = placementRecs[0]    || null;

  const codingAvg  = safeAvg(codingReports, 'score');
  const techAvg    = safeAvg(techReports, 'overallScore');
  const techCommAvg = safeAvg(techReports, 'communicationScore');

  return {
    resume,
    codingReports,
    techReports,
    hr,
    placement,
    // Derived averages
    codingAvg,
    techAvg,
    techCommAvg,
    // Source IDs for the recommendation document
    resumeReportId:           resume?._id || null,
    codingReportId:           codingReports[0]?._id || null,
    technicalInterviewId:     techReports[0]?._id || null,
    hrInterviewId:            hr?._id || null,
    placementRecommendationId: placement?._id || null,
  };
};

/**
 * Build a concise but information-rich text prompt from the collected data.
 */
const buildPrompt = (data) => {
  const { resume, codingAvg, techAvg, techCommAvg, hr, placement } = data;

  const lines = [];

  if (resume) {
    lines.push(`ATS Score: ${resume.atsScore ?? 'N/A'}/100`);
    lines.push(`Resume Score: ${resume.resumeScore ?? 'N/A'}/100`);
    lines.push(`Recommended Role: ${resume.recommendedRole || 'N/A'}`);
    lines.push(`Skills: ${(resume.skills || []).slice(0, 10).join(', ') || 'N/A'}`);
    lines.push(`Resume Strengths: ${(resume.strengths || []).slice(0, 3).join('; ') || 'N/A'}`);
    lines.push(`Resume Weaknesses: ${(resume.weaknesses || []).slice(0, 3).join('; ') || 'N/A'}`);
  }

  if (codingAvg !== null) {
    lines.push(`Coding Avg Score: ${codingAvg}/10`);
    const verdicts = data.codingReports.map(r => r.verdict).filter(Boolean);
    if (verdicts.length) lines.push(`Coding Verdicts: ${verdicts.join(', ')}`);
  }

  if (techAvg !== null) {
    lines.push(`Technical Interview Avg Score: ${techAvg}/10`);
    lines.push(`Communication Score (Tech): ${techCommAvg ?? 'N/A'}/10`);
    const strengths = data.techReports.map(r => r.strength).filter(Boolean).slice(0, 3);
    const weaknesses = data.techReports.map(r => r.weakness).filter(Boolean).slice(0, 3);
    if (strengths.length) lines.push(`Technical Strengths: ${strengths.join('; ')}`);
    if (weaknesses.length) lines.push(`Technical Weaknesses: ${weaknesses.join('; ')}`);
  }

  if (hr) {
    lines.push(`HR Interview Overall: ${hr.overallScore ?? 'N/A'}/10`);
    lines.push(`HR Communication: ${hr.communicationScore ?? 'N/A'}/10`);
    lines.push(`HR Confidence: ${hr.confidenceScore ?? 'N/A'}/10`);
    lines.push(`HR Professionalism: ${hr.professionalismScore ?? 'N/A'}/10`);
    lines.push(`HR Recommendation: ${hr.recommendation || 'N/A'}`);
  }

  if (placement) {
    lines.push(`Placement Readiness: ${placement.overallReadiness || 'N/A'}`);
    lines.push(`Estimated Placement Chance: ${placement.estimatedPlacementChance ?? 'N/A'}%`);
    lines.push(`Placement Recommended Role: ${placement.recommendedRole || 'N/A'}`);
    if ((placement.strengths || []).length)
      lines.push(`Placement Strengths: ${placement.strengths.slice(0, 3).join('; ')}`);
    if ((placement.skillsToImprove || []).length)
      lines.push(`Skills to Improve: ${placement.skillsToImprove.slice(0, 3).join(', ')}`);
  }

  const candidateProfile = lines.join('\n');

  return `You are a senior technical recruiter making a final hiring decision.

Below is the complete AI-generated assessment of a candidate across all evaluation modules.

--- CANDIDATE ASSESSMENT ---
${candidateProfile || 'No assessment data available yet.'}
--- END ASSESSMENT ---

Based on this data, provide your recruiter recommendation.

CRITICAL: Return ONLY a valid JSON object. No markdown. No explanation. No text before or after.
Start with { and end with }.

{
  "overallScore": <number 0-10, one decimal>,
  "recommendation": "<exactly one of: Strong Hire | Hire | Maybe | Need Another Interview | Reject>",
  "riskLevel": "<exactly one of: Low | Medium | High>",
  "technicalReadiness": <number 0-10, one decimal>,
  "communicationReadiness": <number 0-10, one decimal>,
  "cultureFit": <number 0-10, one decimal>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "summary": "<3-4 sentence final recruiter summary covering technical fit, communication, risk, and hiring recommendation>"
}`;
};

/**
 * Parse the GROQ response using multi-strategy extraction.
 * Mirrors the robust parser from fake_skill.py but in JS.
 */
const parseGroqResponse = (raw) => {
  if (!raw || !raw.trim()) return null;

  // Strategy 1: strip markdown fences and parse directly
  let cleaned = raw.trim()
    .replace(/```json?\s*/g, '')
    .replace(/```/g, '')
    .trim();
  try { return JSON.parse(cleaned); } catch (_) {}

  // Strategy 2: extract from first { to last }
  const first = raw.indexOf('{');
  const last  = raw.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try { return JSON.parse(raw.slice(first, last + 1)); } catch (_) {}
  }

  return null;
};

/**
 * Main entry point — called by the controller.
 * candidateId is the userId of the candidate being evaluated.
 */
const generateRecruiterRecommendation = async (candidateId) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const data = await collectCandidateData(candidateId);

  const hasAnyData =
    data.resume || data.codingAvg !== null ||
    data.techAvg !== null || data.hr || data.placement;

  if (!hasAnyData) {
    throw new Error(
      'No assessment data found for this candidate. ' +
      'Complete at least one evaluation module first.'
    );
  }

  const prompt = buildPrompt(data);

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a JSON-only API. Respond with ONLY a valid JSON object. ' +
            'Never include markdown, code fences, or any text outside the JSON object.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 700
    })
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    throw new Error(`GROQ API error: ${err}`);
  }

  const groqData  = await groqRes.json();
  const rawText   = groqData.choices[0].message.content.trim();
  const aiResult  = parseGroqResponse(rawText);

  if (!aiResult) {
    console.error('[RecruiterAgent] JSON parse failed. Raw (first 400):', rawText.slice(0, 400));
    throw new Error('Unable to parse AI response. Please try again.');
  }

  // Validate and clamp
  const VALID_RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Maybe', 'Need Another Interview', 'Reject'];
  const VALID_RISKS = ['Low', 'Medium', 'High'];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));

  const recommendation = new RecruiterRecommendation({
    userId:                    candidateId,
    candidateId:               candidateId,
    resumeReportId:            data.resumeReportId,
    codingReportId:            data.codingReportId,
    technicalInterviewId:      data.technicalInterviewId,
    hrInterviewId:             data.hrInterviewId,
    placementRecommendationId: data.placementRecommendationId,

    overallScore:            Math.round(clamp(aiResult.overallScore, 0, 10) * 10) / 10,
    technicalReadiness:      Math.round(clamp(aiResult.technicalReadiness, 0, 10) * 10) / 10,
    communicationReadiness:  Math.round(clamp(aiResult.communicationReadiness, 0, 10) * 10) / 10,
    cultureFit:              Math.round(clamp(aiResult.cultureFit, 0, 10) * 10) / 10,

    recommendation: VALID_RECOMMENDATIONS.includes(aiResult.recommendation)
      ? aiResult.recommendation : 'Maybe',
    riskLevel: VALID_RISKS.includes(aiResult.riskLevel)
      ? aiResult.riskLevel : 'Medium',

    strengths:  Array.isArray(aiResult.strengths)  ? aiResult.strengths  : [],
    weaknesses: Array.isArray(aiResult.weaknesses) ? aiResult.weaknesses : [],
    summary: typeof aiResult.summary === 'string' ? aiResult.summary : '',
    createdByAI: true
  });

  await recommendation.save();
  return recommendation;
};

/**
 * Fetch the most recent recruiter recommendation for a candidate.
 */
const getLatestRecruiterRecommendation = async (candidateId) => {
  return RecruiterRecommendation.findOne({ candidateId })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Admin: list all recommendations (most recent per candidate).
 */
const getAllRecommendations = async (limit = 50) => {
  return RecruiterRecommendation.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('candidateId', 'name email')
    .lean();
};

module.exports = {
  generateRecruiterRecommendation,
  getLatestRecruiterRecommendation,
  getAllRecommendations
};
