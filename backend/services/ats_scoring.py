"""services/ats_scoring.py — ATS resume scoring logic (replaces utils/atsScoring.js)"""

IMPORTANT_SKILLS = [
    "javascript", "python", "java", "react", "node", "express",
    "mongodb", "sql", "html", "css", "git", "docker", "aws",
    "machine learning", "data structures", "algorithms",
    "typescript", "redux", "rest api", "agile", "linux",
]


def score_resume_text(extracted_text: str, required_skills: list = None) -> dict:
    """
    Scores a resume's extracted text against a skill list.
    Returns: {atsScore, matchedSkills, missingSkills, suggestions}
    """
    text = extracted_text.lower()
    skills_list = required_skills if (required_skills and len(required_skills) > 0) else IMPORTANT_SKILLS

    matched_skills = []
    missing_skills = []

    for skill in skills_list:
        if skill.lower().strip() in text:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    ats_score = round((len(matched_skills) / len(skills_list)) * 100) if skills_list else 0

    suggestions = []
    if ats_score < 40:
        suggestions.append("Add more technical skills to your resume")
    if "project" not in text:
        suggestions.append("Add projects section with descriptions")
    if "experience" not in text:
        suggestions.append("Add work experience or internship details")
    if "education" not in text:
        suggestions.append("Add education details clearly")
    if len(missing_skills) > 5:
        suggestions.append(f"Learn these in-demand skills: {', '.join(missing_skills[:3])}")
    if ats_score >= 70:
        suggestions.append("Great resume! Apply to top product companies")
    if not suggestions:
        suggestions.append("Your resume looks good!")

    return {
        "ats_score": ats_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
    }
