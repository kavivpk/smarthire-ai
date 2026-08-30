"""
services/placement_recommendation_service.py — Placement recommendation service (replaces placementRecommendationService.js)
"""
import os
import httpx
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models.coding_report import CodingReport
from models.interview_report import InterviewReport
from models.hr_interview_report import HRInterviewReport
from models.resume_report import ResumeReport
from models.interview import Interview
from models.placement_recommendation import PlacementRecommendation
from models.user import User
from services.notification_service import notify
from services.email_service import send_placement_recommendation_report

logger = logging.getLogger(__name__)

def safe_avg(docs: list, field: str) -> float:
    vals = [getattr(d, field) for d in docs if getattr(d, field) is not None]
    nums = [v for v in vals if isinstance(v, (int, float)) and v == v]
    if not nums:
        return 0.0
    return round((sum(nums) / len(nums)) * 10) / 10


def collect_user_scores(db: Session, user_id: int) -> dict:
    coding = db.query(CodingReport).filter(CodingReport.user_id == user_id).all()
    technical = db.query(InterviewReport).filter(InterviewReport.user_id == user_id).all()
    hr = db.query(HRInterviewReport).filter(HRInterviewReport.user_id == user_id).all()
    resume_reports = (
        db.query(ResumeReport)
        .filter(ResumeReport.user_id == user_id)
        .order_by(desc(ResumeReport.created_at))
        .limit(1)
        .all()
    )
    aptitude = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.topic.in_(["aptitude", "Aptitude"])
        )
        .all()
    )

    latest_resume = resume_reports[0] if resume_reports else None

    return {
        "codingScore": safe_avg(coding, "score"),
        "technicalScore": safe_avg(technical, "overall_score"),
        "hrScore": safe_avg(hr, "overall_score"),
        "resumeScore": safe_avg(resume_reports, "ats_score"),
        "aptitudeScore": safe_avg(aptitude, "total_score"),
        "latestResume": latest_resume
    }


async def generate_ai_recommendation(scores: dict) -> dict:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    if not GROQ_API_KEY:
        return None

    codingScore = scores["codingScore"]
    technicalScore = scores["technicalScore"]
    hrScore = scores["hrScore"]
    resumeScore = scores["resumeScore"]
    aptitudeScore = scores["aptitudeScore"]
    latestResume = scores["latestResume"]

    skills = latestResume.skills if (latestResume and latestResume.skills) else []
    missing_skills = latestResume.missing_skills if (latestResume and latestResume.missing_skills) else []
    recommended_role = latestResume.recommended_role if latestResume else "Not specified"

    prompt = f"""You are a placement expert and career coach. Based on a student's assessment scores, generate a detailed placement recommendation.

Assessment Scores (all out of 10 unless noted):
- Aptitude: {aptitudeScore}/10
- Coding: {codingScore}/10
- Technical Interview: {technicalScore}/10
- HR Interview: {hrScore}/10
- Resume ATS Score: {resumeScore}/100

Skills from Resume: {', '.join(skills) if skills else 'Not available'}
Missing Skills: {', '.join(missing_skills) if missing_skills else 'None identified'}
Resume Recommended Role: {recommended_role}

Generate a comprehensive placement recommendation. Respond ONLY with a valid JSON object (no markdown, no explanation):
{{
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
}}"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                },
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1500
                }
            )
            if res.status_code != 200:
                return None
            data = res.json()
            raw = data["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):
                raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
    except Exception as e:
        logger.error(f"GROQ placement recommendation failed: {e}")
        return None


def build_fallback_recommendation(scores: dict) -> dict:
    codingScore = scores["codingScore"]
    technicalScore = scores["technicalScore"]
    hrScore = scores["hrScore"]
    resumeScore = scores["resumeScore"]
    aptitudeScore = scores["aptitudeScore"]
    latestResume = scores["latestResume"]

    resume_norm = round(resumeScore / 10 * 10) / 10 if resumeScore else 0.0
    normalized = [codingScore, technicalScore, hrScore, resume_norm, aptitudeScore]
    valid_scores = [v for v in normalized if v > 0]
    
    overallScore = round((sum(valid_scores) / len(valid_scores)) * 10) / 10 if valid_scores else 0.0

    overallReadiness = "Good" if overallScore >= 7 else "Average" if overallScore >= 4 else "Needs Work"
    recommendedRole = latestResume.recommended_role if latestResume and latestResume.recommended_role else "Software Developer"
    
    recommendedCompanies = ["Product companies", "Mid-size tech firms"] if overallScore >= 7 else ["Service companies", "Startups"]

    strengths = latestResume.strengths if (latestResume and latestResume.strengths) else []
    weaknesses = latestResume.weaknesses if (latestResume and latestResume.weaknesses) else []
    skills_to_improve = latestResume.missing_skills[:5] if (latestResume and latestResume.missing_skills) else []
    learning_roadmap = latestResume.improvement_suggestions if (latestResume and latestResume.improvement_suggestions) else []

    return {
        "overallScore": overallScore,
        "overallReadiness": overallReadiness,
        "recommendedRole": recommendedRole,
        "recommendedCompanies": recommendedCompanies,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skillsToImprove": skills_to_improve,
        "learningRoadmap": learning_roadmap,
        "estimatedPlacementChance": min(round(overallScore * 10), 95),
        "aiSummary": f"Based on your assessment scores, your overall placement readiness is {overallScore}/10. Keep practising to improve your profile."
    }


async def generate_and_save_recommendation(db: Session, user_id: int):
    scores = collect_user_scores(db, user_id)

    has_data = (
        scores["codingScore"] > 0
        or scores["technicalScore"] > 0
        or scores["hrScore"] > 0
        or scores["resumeScore"] > 0
        or scores["aptitudeScore"] > 0
    )

    if not has_data:
        return {"message": "No assessment data found. Complete at least one assessment first."}

    ai_result = await generate_ai_recommendation(scores)
    if not ai_result:
        ai_result = build_fallback_recommendation(scores)

    recommendation = PlacementRecommendation(
        user_id=user_id,
        aptitude_score=scores["aptitudeScore"],
        coding_score=scores["codingScore"],
        technical_score=scores["technicalScore"],
        hr_score=scores["hrScore"],
        resume_score=scores["resumeScore"],
        overall_score=ai_result.get("overallScore", 0.0),
        overall_readiness=ai_result.get("overallReadiness", "Not Evaluated"),
        recommended_role=ai_result.get("recommendedRole", ""),
        recommended_companies=ai_result.get("recommendedCompanies", []),
        strengths=ai_result.get("strengths", []),
        weaknesses=ai_result.get("weaknesses", []),
        skills_to_improve=ai_result.get("skillsToImprove", []),
        learning_roadmap=ai_result.get("learningRoadmap", []),
        estimated_placement_chance=ai_result.get("estimatedPlacementChance", 0.0),
        ai_summary=ai_result.get("aiSummary", ""),
        created_by_ai=True
    )

    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)

    # Send Notification (fire-and-forget)
    async def email_fn():
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.email:
            send_placement_recommendation_report(user.email, user.name, {
                **ai_result,
                "aptitudeScore": scores["aptitudeScore"],
                "codingScore": scores["codingScore"],
                "technicalScore": scores["technicalScore"],
                "hrScore": scores["hrScore"],
                "resumeScore": scores["resumeScore"]
            })

    notify(
        db,
        user_id,
        "placement_recommendation",
        "Placement Recommendation Generated",
        f"Your placement readiness is {recommendation.overall_readiness}. Estimated chance: {recommendation.estimated_placement_chance}%. Role: {recommendation.recommended_role}.",
        email_fn
    )

    return recommendation


def get_latest_recommendation(db: Session, user_id: int):
    return (
        db.query(PlacementRecommendation)
        .filter(PlacementRecommendation.user_id == user_id)
        .order_by(desc(PlacementRecommendation.created_at))
        .first()
    )
