const mongoose = require('mongoose');
const CodingReport = require('../models/CodingReport');
const InterviewReport = require('../models/InterviewReport');
const HRInterviewReport = require('../models/HRInterviewReport');
const ResumeReport = require('../models/ResumeReport');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');

// ── Helper: safe average ──────────────────────────────────────────────────────
const safeAvg = (arr, field) => {
  const values = arr.map(d => d[field]).filter(v => typeof v === 'number' && isFinite(v));
  if (!values.length) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
};

// ── 1. Per-user summary analytics ────────────────────────────────────────────
const getUserAnalytics = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [
    codingReports,
    interviewReports,
    hrReports,
    resumeReports,
    aptitudeInterviews
  ] = await Promise.all([
    CodingReport.find({ userId: uid }).select('score verdict createdAt').lean(),
    InterviewReport.find({ userId: uid }).select('overallScore technicalScore communicationScore createdAt').lean(),
    HRInterviewReport.find({ userId: uid }).select('overallScore communicationScore confidenceScore professionalismScore createdAt').lean(),
    ResumeReport.find({ userId: uid }).select('atsScore resumeScore skills recommendedRole createdAt').lean(),
    // Aptitude stored in legacy Interview collection with topic matching 'aptitude' or section-based score
    Interview.find({ userId: uid, topic: { $in: ['aptitude', 'Aptitude', 'mixed', 'AI Live', 'Admin Live'] } })
      .select('totalScore topic completedAt createdAt').lean()
  ]);

  // Scores (all on 0–10 scale except resume which is 0–100)
  const codingAvg = safeAvg(codingReports, 'score');                        // 0–10
  const technicalAvg = safeAvg(interviewReports, 'overallScore');            // 0–10
  const hrAvg = safeAvg(hrReports, 'overallScore');                          // 0–10
  const resumeAvgRaw = safeAvg(resumeReports, 'atsScore');                   // 0–100
  const aptitudeAvg = safeAvg(aptitudeInterviews, 'totalScore');             // 0–10

  // Normalize all to 0–10 for Placement Readiness
  const resumeNorm = Math.round(resumeAvgRaw / 10 * 10) / 10;
  const scores = [codingAvg, technicalAvg, hrAvg, resumeNorm, aptitudeAvg].filter(s => s > 0);
  const overallReadiness = scores.length
    ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
    : 0;

  // Total assessments (de-duplicated counts)
  const totalAssessments =
    codingReports.length +
    interviewReports.length +
    hrReports.length +
    resumeReports.length +
    aptitudeInterviews.length;

  // Skill distribution from latest resume report
  const latestResume = resumeReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const skillDistribution = latestResume?.skills || [];
  const recommendedRole = latestResume?.recommendedRole || '';

  return {
    totalAssessments,
    codingAverage: codingAvg,
    technicalInterviewAverage: technicalAvg,
    hrInterviewAverage: hrAvg,
    resumeScoreAverage: resumeAvgRaw,
    aptitudeAverage: aptitudeAvg,
    overallPlacementReadiness: overallReadiness,
    skillDistribution,
    recommendedRole,
    counts: {
      codingTests: codingReports.length,
      technicalInterviews: interviewReports.length,
      hrInterviews: hrReports.length,
      resumeUploads: resumeReports.length,
      aptitudeTests: aptitudeInterviews.length
    }
  };
};

// ── 2. Weekly activity (last 7 days) per user ─────────────────────────────────
const getWeeklyActivity = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dateGroup = {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 }
    }
  };
  const dateSort = { $sort: { _id: 1 } };
  const matchRecent = (extraMatch = {}) => ({
    $match: { userId: uid, createdAt: { $gte: sevenDaysAgo }, ...extraMatch }
  });

  const [coding, technical, hr, resume] = await Promise.all([
    CodingReport.aggregate([matchRecent(), dateGroup, dateSort]),
    InterviewReport.aggregate([matchRecent(), dateGroup, dateSort]),
    HRInterviewReport.aggregate([matchRecent(), dateGroup, dateSort]),
    ResumeReport.aggregate([matchRecent(), dateGroup, dateSort])
  ]);

  // Build a unified day-by-day map for the last 7 days
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { date: key, coding: 0, technical: 0, hr: 0, resume: 0, total: 0 };
  }

  coding.forEach(r => { if (days[r._id]) days[r._id].coding = r.count; });
  technical.forEach(r => { if (days[r._id]) days[r._id].technical = r.count; });
  hr.forEach(r => { if (days[r._id]) days[r._id].hr = r.count; });
  resume.forEach(r => { if (days[r._id]) days[r._id].resume = r.count; });

  return Object.values(days).map(d => ({
    ...d,
    total: d.coding + d.technical + d.hr + d.resume
  }));
};

// ── 3. Recent reports across all modules ─────────────────────────────────────
const getRecentReports = async (userId, limit = 5) => {
  const uid = new mongoose.Types.ObjectId(userId);

  const [coding, technical, hr, resume] = await Promise.all([
    CodingReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit)
      .select('problemTitle score verdict language createdAt').lean(),
    InterviewReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit)
      .select('interviewType overallScore createdAt').lean(),
    HRInterviewReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit)
      .select('interviewType overallScore createdAt').lean(),
    ResumeReport.find({ userId: uid }).sort({ createdAt: -1 }).limit(limit)
      .select('fileName atsScore resumeScore recommendedRole createdAt').lean()
  ]);

  const tag = (items, type) => items.map(item => ({ ...item, reportType: type }));

  return [
    ...tag(coding, 'Coding'),
    ...tag(technical, 'Technical Interview'),
    ...tag(hr, 'HR Interview'),
    ...tag(resume, 'Resume')
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// ── 4. Admin-level aggregate analytics (all users) ───────────────────────────
const getAdminAnalytics = async () => {
  const [
    totalCoding,
    totalTechnical,
    totalHR,
    totalResume,
    codingAvgArr,
    technicalAvgArr,
    hrAvgArr,
    resumeAvgArr,
    topSkills
  ] = await Promise.all([
    CodingReport.countDocuments(),
    InterviewReport.countDocuments(),
    HRInterviewReport.countDocuments(),
    ResumeReport.countDocuments(),
    CodingReport.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]),
    InterviewReport.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]),
    HRInterviewReport.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]),
    ResumeReport.aggregate([{ $group: { _id: null, avg: { $avg: '$atsScore' } } }]),
    // Top skills across all resume reports
    ResumeReport.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    totalAssessments: totalCoding + totalTechnical + totalHR + totalResume,
    counts: {
      codingTests: totalCoding,
      technicalInterviews: totalTechnical,
      hrInterviews: totalHR,
      resumeUploads: totalResume
    },
    averages: {
      coding: Math.round((codingAvgArr[0]?.avg || 0) * 10) / 10,
      technical: Math.round((technicalAvgArr[0]?.avg || 0) * 10) / 10,
      hr: Math.round((hrAvgArr[0]?.avg || 0) * 10) / 10,
      resume: Math.round((resumeAvgArr[0]?.avg || 0) * 10) / 10
    },
    topSkills: topSkills.map(s => ({ skill: s._id, count: s.count }))
  };
};

module.exports = {
  getUserAnalytics,
  getWeeklyActivity,
  getRecentReports,
  getAdminAnalytics
};
