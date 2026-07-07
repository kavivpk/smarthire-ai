const Resume = require('../models/Resume');
const ResumeReport = require('../models/ResumeReport');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');
const path = require('path');
const { notify } = require('../services/notificationService');
const { scoreResumeText } = require('../utils/atsScoring');

const IMPORTANT_SKILLS = [
  'javascript', 'python', 'java', 'react', 'node', 'express',
  'mongodb', 'sql', 'html', 'css', 'git', 'docker', 'aws',
  'machine learning', 'data structures', 'algorithms',
  'typescript', 'redux', 'rest api', 'agile', 'linux'
];

const analyzeResume = async (req, res) => {
  try {
    console.log('File received:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const filePath = path.resolve(req.file.path);
    console.log('File path:', filePath);

    // File exists check
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'File not found after upload' });
    }

    const pdfBuffer = fs.readFileSync(filePath);
    console.log('Buffer size:', pdfBuffer.length);

    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text.toLowerCase();
    console.log('Extracted text length:', extractedText.length);

    // ATS Scoring
    // const matchedSkills = [];
    // const missingSkills = [];

    // IMPORTANT_SKILLS.forEach(skill => {
    //   if (extractedText.includes(skill)) {
    //     matchedSkills.push(skill);
    //   } else {
    //     missingSkills.push(skill);
    //   }
    // });

    // const atsScore = Math.round(
    //   (matchedSkills.length / IMPORTANT_SKILLS.length) * 100
    // );

    // // Suggestions
    // const suggestions = [];
    // if (atsScore < 40) suggestions.push('Add more technical skills to your resume');
    // if (!extractedText.includes('project')) suggestions.push('Add projects section with descriptions');
    // if (!extractedText.includes('experience')) suggestions.push('Add work experience or internship details');
    // if (!extractedText.includes('education')) suggestions.push('Add education details clearly');
    // if (missingSkills.length > 5) {
    //   suggestions.push(`Learn these in-demand skills: ${missingSkills.slice(0, 3).join(', ')}`);
    // }
    // if (atsScore >= 70) suggestions.push('Great resume! Apply to top product companies');
    // if (suggestions.length === 0) suggestions.push('Your resume looks good!');

    const { atsScore, matchedSkills, missingSkills, suggestions } = scoreResumeText(extractedText, IMPORTANT_SKILLS);

    // Save to DB
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      extractedText: extractedText.slice(0, 500),
      atsScore,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 8),
      suggestions
    });

    // Cleanup uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.log('Cleanup warning:', e.message);
    }

    res.status(201).json({
      message: 'Resume analyzed successfully',
      atsScore,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 8),
      suggestions,
      resumeId: resume._id
    });

    // AI-powered deep analysis + ResumeReport persistence (fire-and-forget)
    // Runs after response is sent — never blocks or breaks the existing flow
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY && req.user && req.user.id) {
      const prompt = `You are an expert resume analyzer. Analyze the resume below and return ONLY a valid JSON object.

Resume Text:
${extractedText.slice(0, 3000)}

Matched Skills: ${matchedSkills.join(', ') || 'None'}
Missing Skills: ${missingSkills.slice(0, 8).join(', ') || 'None'}
ATS Score: ${atsScore}%

Return ONLY this JSON (no markdown, no explanation):
{
  "skills": [],
  "projects": [],
  "education": [],
  "experience": [],
  "certifications": [],
  "strengths": [],
  "weaknesses": [],
  "resumeScore": 0,
  "recommendedRole": "",
  "improvementSuggestions": [],
  "overallFeedback": ""
}`;

      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 800
        })
      })
        .then(r => r.ok ? r.json() : null)
        .then(groqData => {
          let aiResult = null;
          if (groqData) {
            try {
              const raw = groqData.choices[0].message.content
                .trim()
                .replace(/```json?/g, '')
                .replace(/```/g, '')
                .trim();
              aiResult = JSON.parse(raw);
            } catch (_) { /* ignore parse errors */ }
          }

          return ResumeReport.create({
            userId: req.user.id,
            resumeId: resume._id,
            fileName: req.file ? req.file.originalname : '',
            skills: aiResult?.skills?.length ? aiResult.skills : matchedSkills,
            missingSkills: aiResult ? (aiResult.missingSkills || []) : missingSkills.slice(0, 8),
            projects: aiResult?.projects || [],
            education: aiResult?.education || [],
            experience: aiResult?.experience || [],
            certifications: aiResult?.certifications || [],
            strengths: aiResult?.strengths || [],
            weaknesses: aiResult?.weaknesses || [],
            atsScore,
            resumeScore: typeof aiResult?.resumeScore === 'number' ? aiResult.resumeScore : atsScore,
            recommendedRole: aiResult?.recommendedRole || '',
            improvementSuggestions: aiResult?.improvementSuggestions?.length
              ? aiResult.improvementSuggestions
              : suggestions,
            overallFeedback: aiResult?.overallFeedback || '',
            createdByAI: true
          });
        })
        .then(() => {
          // Notification — store history + no duplicate email (email already sent above if configured)
          notify(req.user.id, {
            type: 'resume',
            title: 'Resume Analyzed Successfully',
            message: `Your resume scored ${atsScore}% on the ATS check. ${matchedSkills.length} skills matched.`
          });
        })
        .catch(err => console.error('Failed to save ResumeReport:', err));
    }

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      message: 'Analysis failed',
      error: error.message
    });
  }
};

const getResumeHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { analyzeResume, getResumeHistory };