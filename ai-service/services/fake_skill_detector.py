import re

VERIFIABLE_SKILLS = [
    'react', 'angular', 'vue', 'nodejs', 'node.js', 'express', 'django',
    'flask', 'fastapi', 'spring', 'mongodb', 'postgresql', 'mysql',
    'docker', 'kubernetes', 'aws', 'azure', 'machine learning',
    'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
    'typescript', 'graphql', 'microservices', 'redis', 'kafka',
    'python', 'java', 'javascript', 'c++', 'golang', 'rust',
    'html', 'css', 'sql', 'git', 'linux', 'devops', 'ci/cd'
]

EXPERIENCE_LEVELS = {
    'expert': 5,
    'advanced': 3,
    'proficient': 2,
    'experienced': 2,
    'strong': 2,
    'excellent': 3,
    'master': 5,
    'specialist': 4,
    'hands-on': 2,
    'extensive': 4,
}

RED_FLAG_PHRASES = [
    'expert in all',
    'proficient in all',
    'know everything',
    'full knowledge',
    'master of all',
    'expert in multiple',
]

SUSPICIOUS_COMBINATIONS = [
    ['machine learning', 'deep learning', 'kubernetes', 'microservices'],
    ['aws', 'azure', 'gcp'],
    ['react', 'angular', 'vue'],
    ['tensorflow', 'pytorch', 'scikit-learn'],
]

def extract_years_experience(text):
    patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
        r'experience\s*(?:of\s*)?(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
    ]
    years = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        years.extend([int(m) for m in matches])
    return max(years) if years else None

def check_skill_evidence(text, skill):
    evidence_score = 0
    skill_lower = skill.lower()

    if skill_lower not in text:
        return 0

    # Project evidence
    project_patterns = [
        rf'(?:built|developed|created|implemented|designed|worked on).*{skill_lower}',
        rf'{skill_lower}.*(?:project|application|app|system|website)',
        rf'(?:project|application|app).*{skill_lower}',
    ]
    for pattern in project_patterns:
        if re.search(pattern, text):
            evidence_score += 2
            break

    # GitHub/portfolio
    if ('github' in text or 'gitlab' in text or 'portfolio' in text) and skill_lower in text:
        evidence_score += 1

    # Certification
    cert_keywords = ['certified', 'certification', 'certificate', 'course', 'udemy', 'coursera']
    if any(c in text for c in cert_keywords) and skill_lower in text:
        evidence_score += 2

    # Work/internship context
    work_patterns = [
        rf'(?:internship|intern|worked|experience|company|organization).*{skill_lower}',
        rf'{skill_lower}.*(?:internship|intern|worked|experience)',
    ]
    for pattern in work_patterns:
        if re.search(pattern, text):
            evidence_score += 2
            break

    return evidence_score

def detect_fake_skills(text):
    text_lower = text.lower()
    warnings = []
    flags = []
    suspicious_skills = []
    credible_skills = []

    # 1. Red flag phrases
    for phrase in RED_FLAG_PHRASES:
        if phrase in text_lower:
            flags.append({
                'type': 'red_flag_phrase',
                'detail': f'Suspicious phrase: "{phrase}"',
                'severity': 'high'
            })

    # 2. Years experience checks
    years_exp = extract_years_experience(text_lower)
    skill_count = sum(1 for s in VERIFIABLE_SKILLS if s in text_lower)

    if years_exp is not None:
        if years_exp >= 8 and ('fresher' in text_lower or 'fresh graduate' in text_lower):
            flags.append({
                'type': 'experience_mismatch',
                'detail': f'Claims {years_exp} years but mentions fresher/fresh graduate',
                'severity': 'high'
            })
        if skill_count > 18:
            flags.append({
                'type': 'too_many_skills',
                'detail': f'{skill_count} technical skills claimed — verify each with evidence',
                'severity': 'medium'
            })

    # 3. Expert level claims
    for level, min_years in EXPERIENCE_LEVELS.items():
        if level in text_lower:
            for skill in VERIFIABLE_SKILLS:
                patterns = [
                    rf'{level}\s+(?:in\s+)?{re.escape(skill)}',
                    rf'{re.escape(skill)}\s*[-–:]\s*{level}',
                    rf'{level}\s+{re.escape(skill)}\s+developer',
                ]
                found = any(re.search(p, text_lower) for p in patterns)
                if found:
                    evidence = check_skill_evidence(text_lower, skill)
                    if evidence < 2:
                        suspicious_skills.append({
                            'skill': skill,
                            'claim': f'{level.capitalize()} level claimed',
                            'evidence_score': evidence,
                            'warning': f'No supporting project/experience found for "{skill}"'
                        })
                    else:
                        if skill not in credible_skills:
                            credible_skills.append(skill)

    # 4. Suspicious combinations
    for combo in SUSPICIOUS_COMBINATIONS:
        found = [s for s in combo if s in text_lower]
        if len(found) >= 3:
            flags.append({
                'type': 'suspicious_combination',
                'detail': f'Claims: {", ".join(found)} — unusually broad expertise',
                'severity': 'medium'
            })

    # 5. Skills listed without any context
    for skill in VERIFIABLE_SKILLS:
        if skill in text_lower:
            evidence = check_skill_evidence(text_lower, skill)
            already_suspicious = any(s['skill'] == skill for s in suspicious_skills)
            already_credible = skill in credible_skills

            if not already_suspicious and not already_credible:
                if evidence == 0:
                    warnings.append({
                        'skill': skill,
                        'warning': f'"{skill}" listed but no project/experience context'
                    })
                elif evidence >= 2:
                    credible_skills.append(skill)

    # 6. Fresh graduate over-claiming check
    is_fresher = any(w in text_lower for w in [
        'fresher', 'fresh graduate', 'b.tech', 'b.e.', 'bachelor',
        'final year', 'pursuing', 'cgpa', 'gpa', '2024', '2025', '2026'
    ])

    if is_fresher and skill_count > 12:
        flags.append({
            'type': 'fresher_overclaiming',
            'detail': f'Fresh graduate with {skill_count} technical skills — ensure all are genuinely practiced',
            'severity': 'medium'
        })

    if is_fresher and len(credible_skills) == 0 and skill_count > 0:
        # For freshers with no explicit level claims, check evidence
        for skill in VERIFIABLE_SKILLS:
            if skill in text_lower:
                evidence = check_skill_evidence(text_lower, skill)
                if evidence == 0:
                    warnings.append({
                        'skill': skill,
                        'warning': f'Add project details showing how you used "{skill}"'
                    })

    # Remove duplicates
    seen = set()
    unique_warnings = []
    for w in warnings:
        if w['skill'] not in seen:
            seen.add(w['skill'])
            unique_warnings.append(w)

    # Calculate score
    total_issues = len(flags) * 3 + len(suspicious_skills) * 2 + len(unique_warnings)
    credibility_score = max(0, min(100, 100 - (total_issues * 4)))

    # Verdict
    if credibility_score >= 80:
        verdict = "Credible"
        verdict_color = "green"
    elif credibility_score >= 60:
        verdict = "Mostly Credible"
        verdict_color = "amber"
    elif credibility_score >= 40:
        verdict = "Some Concerns"
        verdict_color = "orange"
    else:
        verdict = "High Risk"
        verdict_color = "red"

    return {
        'credibility_score': credibility_score,
        'verdict': verdict,
        'verdict_color': verdict_color,
        'red_flags': flags,
        'suspicious_skills': suspicious_skills[:5],
        'skills_without_evidence': unique_warnings[:6],
        'credible_skills': list(set(credible_skills))[:8],
        'years_experience_found': years_exp,
        'total_skills_found': skill_count,
        'total_issues_found': len(flags) + len(suspicious_skills),
        'recommendation': get_recommendation(credibility_score, len(unique_warnings))
    }

def get_recommendation(score, warning_count):
    if score >= 80:
        if warning_count > 3:
            return "Resume looks genuine! Add more project descriptions to strengthen skill evidence."
        return "Resume looks genuine. Skills appear well-supported with evidence."
    elif score >= 60:
        return "Resume is mostly credible. Add GitHub links and project descriptions for flagged skills."
    elif score >= 40:
        return "Several skills lack evidence. Add project details, GitHub links, or certifications."
    else:
        return "Resume has credibility concerns. Add verifiable proof (projects, GitHub, certificates) for each skill."