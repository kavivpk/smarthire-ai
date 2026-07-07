const IMPORTANT_SKILLS = [
  'javascript', 'python', 'java', 'react', 'node', 'express',
  'mongodb', 'sql', 'html', 'css', 'git', 'docker', 'aws',
  'machine learning', 'data structures', 'algorithms',
  'typescript', 'redux', 'rest api', 'agile', 'linux'
];

function scoreResumeText(extractedText, requiredSkills) {
  const text = extractedText.toLowerCase();
  const skillsList = (requiredSkills && requiredSkills.length > 0)
    ? requiredSkills
    : IMPORTANT_SKILLS;

  const matchedSkills = [];
  const missingSkills = [];

  skillsList.forEach(skill => {
    if (text.includes(skill.toLowerCase().trim())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const atsScore = Math.round((matchedSkills.length / skillsList.length) * 100);

  const suggestions = [];
  if (atsScore < 40) suggestions.push('Add more technical skills to your resume');
  if (!text.includes('project')) suggestions.push('Add projects section with descriptions');
  if (!text.includes('experience')) suggestions.push('Add work experience or internship details');
  if (!text.includes('education')) suggestions.push('Add education details clearly');
  if (missingSkills.length > 5) {
    suggestions.push(`Learn these in-demand skills: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (atsScore >= 70) suggestions.push('Great resume! Apply to top product companies');
  if (suggestions.length === 0) suggestions.push('Your resume looks good!');

  return { atsScore, matchedSkills, missingSkills, suggestions };
}

module.exports = { IMPORTANT_SKILLS, scoreResumeText };