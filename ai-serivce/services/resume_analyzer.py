import pdfplumber
import re

# Comprehensive skill list
TECH_SKILLS = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
    'react', 'angular', 'vue', 'nextjs', 'nodejs', 'express', 'django', 'flask',
    'fastapi', 'spring', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
    'data analysis', 'pandas', 'numpy', 'sql', 'html', 'css', 'tailwind',
    'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'ci/cd',
    'redis', 'kafka', 'rabbitmq', 'terraform', 'ansible'
]

# Job role skill requirements
JOB_REQUIREMENTS = {
    'frontend': ['react', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'vue', 'angular'],
    'backend': ['nodejs', 'python', 'java', 'express', 'django', 'postgresql', 'mongodb', 'rest api'],
    'fullstack': ['react', 'nodejs', 'mongodb', 'javascript', 'html', 'css', 'git', 'rest api'],
    'data_science': ['python', 'machine learning', 'pandas', 'numpy', 'sql', 'tensorflow', 'scikit-learn'],
    'devops': ['docker', 'kubernetes', 'aws', 'linux', 'git', 'ci/cd', 'terraform', 'ansible'],
}

def extract_text(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.lower()

def calculate_ats_score(text: str, matched: list) -> int:
    score = 0

    # Skills score (50%)
    skill_score = min(len(matched) * 3, 50)
    score += skill_score

    # Sections check (30%)
    sections = {
        'education': 10,
        'experience': 8,
        'project': 7,
        'skill': 5,
    }
    for section, points in sections.items():
        if section in text:
            score += points

    # Formatting checks (20%)
    if 'github' in text or 'linkedin' in text:
        score += 5
    if '@' in text:
        score += 5
    if len(text.split()) > 200:
        score += 5
    if len(text.split()) > 400:
        score += 5

    return min(score, 100)

def generate_suggestions(text, matched, missing, ats_score):
    suggestions = []

    if ats_score < 40:
        suggestions.append("⚠️ Low ATS score — add more relevant technical skills")
    if 'project' not in text:
        suggestions.append("📁 Add a Projects section with detailed descriptions")
    if 'github' not in text:
        suggestions.append("💻 Add your GitHub profile link")
    if 'linkedin' not in text:
        suggestions.append("🔗 Add your LinkedIn profile link")
    if len(missing) > 8:
        top_missing = missing[:4]
        suggestions.append(f"📚 Learn these high-demand skills: {', '.join(top_missing)}")
    if 'internship' not in text and 'experience' not in text:
        suggestions.append("💼 Add internship or work experience details")
    if ats_score >= 70:
        suggestions.append("🌟 Excellent resume! Ready for product-based companies")
    elif ats_score >= 50:
        suggestions.append("✅ Good resume! Few improvements can make it stronger")

    return suggestions

def detect_skill_gaps(matched: list) -> dict:
    gaps = {}
    for role, required in JOB_REQUIREMENTS.items():
        missing = [s for s in required if s not in matched]
        match_pct = round(((len(required) - len(missing)) / len(required)) * 100)
        gaps[role] = {
            'match_percentage': match_pct,
            'missing_skills': missing
        }
    return gaps

def analyze_resume_advanced(pdf_path: str) -> dict:
    # Extract text
    text = extract_text(pdf_path)

    if not text.strip():
        raise Exception("Could not extract text from PDF")

    # Match skills
    matched_skills = [s for s in TECH_SKILLS if s in text]
    missing_skills = [s for s in TECH_SKILLS if s not in text]

    # ATS Score
    ats_score = calculate_ats_score(text, matched_skills)

    # Suggestions
    suggestions = generate_suggestions(text, matched_skills, missing_skills, ats_score)

    # Skill gaps by role
    skill_gaps = detect_skill_gaps(matched_skills)

    # Best matching role
    best_role = max(skill_gaps, key=lambda r: skill_gaps[r]['match_percentage'])

    return {
        "ats_score": ats_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills[:10],
        "suggestions": suggestions,
        "skill_gaps": skill_gaps,
        "best_matching_role": best_role,
        "best_role_match_percentage": skill_gaps[best_role]['match_percentage'],
        "total_skills_found": len(matched_skills),
        "word_count": len(text.split())
    }