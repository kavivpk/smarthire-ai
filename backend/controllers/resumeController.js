const Resume = require('../models/Resume');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

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
    const matchedSkills = [];
    const missingSkills = [];

    IMPORTANT_SKILLS.forEach(skill => {
      if (extractedText.includes(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const atsScore = Math.round(
      (matchedSkills.length / IMPORTANT_SKILLS.length) * 100
    );

    // Suggestions
    const suggestions = [];
    if (atsScore < 40) suggestions.push('Add more technical skills to your resume');
    if (!extractedText.includes('project')) suggestions.push('Add projects section with descriptions');
    if (!extractedText.includes('experience')) suggestions.push('Add work experience or internship details');
    if (!extractedText.includes('education')) suggestions.push('Add education details clearly');
    if (missingSkills.length > 5) {
      suggestions.push(`Learn these in-demand skills: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    if (atsScore >= 70) suggestions.push('Great resume! Apply to top product companies');
    if (suggestions.length === 0) suggestions.push('Your resume looks good!');

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