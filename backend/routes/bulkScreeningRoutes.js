const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { scoreResumeText, IMPORTANT_SKILLS } = require('../utils/atsScoring');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

function parseRequirements(requirementsText) {
  if (!requirementsText || !requirementsText.trim()) return null;
  
  // If it contains commas, split by comma
  if (requirementsText.includes(',')) {
    return requirementsText.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  // If it contains newlines, split by newline
  if (requirementsText.includes('\n')) {
    const lines = requirementsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length > 1) {
      return lines;
    }
  }

  const text = requirementsText.toLowerCase().trim();
  // Check if it's a known skill in IMPORTANT_SKILLS
  const found = IMPORTANT_SKILLS.filter(skill => text.includes(skill.toLowerCase()));
  if (found.length > 0) {
    return found;
  }

  // If it's a short input (e.g. up to 3 words) and not in IMPORTANT_SKILLS, treat the entire string as a single skill
  const words = text.split(/\s+/);
  if (words.length <= 3) {
    return [requirementsText.trim()];
  }

  return null;
}

router.post('/analyze', protect, upload.array('resumes', 1000), async (req, res) => {

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one resume PDF' });
    }

    const requiredSkills = parseRequirements(req.body.requirements);
    const results = [];

    for (const file of req.files) {
      const filePath = path.resolve(file.path);
      try {
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text.toLowerCase();

        const { atsScore, matchedSkills, missingSkills } = scoreResumeText(extractedText, requiredSkills);

        results.push({
          fileName: file.originalname,
          atsScore,
          matchedSkills,
          missingSkills: missingSkills.slice(0, 10),
          textPreview: extractedText.slice(0, 200)
        });
      } catch (err) {
        results.push({
          fileName: file.originalname,
          error: 'Could not parse this file'
        });
      } finally {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
      }
    }

    results.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));

    res.json({ totalResumes: results.length, results });
  } catch (error) {
    console.error('Bulk screening error:', error);
    res.status(500).json({ message: 'Bulk screening failed', error: error.message });
  }
});

module.exports = router;
