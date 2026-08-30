"""
services/recruiter_agent_service.py — Recruiter agent service (replaces recruiterAgentService.js)
"""
import os
import httpx
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models.user import User
from models.resume_report import ResumeReport
from models.coding_report import CodingReport
from models.technical_interview_report import TechnicalInterviewReport
from models.hr_interview_report import HRInterviewReport
from models.placement_recommendation import PlacementRecommendation
from models.recruiter_recommendation import RecruiterRecommendation

logger = logging.getLogger(__name__)

def safe_avg(docs: list, field: str) -> float:
    vals = [getattr(d, field) for d in docs if getattr(d, field) is not None]
    nums = [v for v in vals if isinstance(v, (int, float)) and v == v]
    if not nums:
        return None
    return round((sum(nums) / len(nums)) * 10) / 10


def collect_candidate_data(db: Session, user_id: int) -> dict:
    resume_report = (
        db.query(ResumeReport)
        .filter(ResumeReport.user_id == user_id)
        .order_by(desc(ResumeReport.created_at))
        .first()
    )
    coding_reports = (
        db.query(CodingReport)
        .filter(CodingReport.user_id == user_id)
        .order_by(desc(CodingReport.created_at))
        .limit(5)
        .all()
    )
    tech_reports = (
        db.query(TechnicalInterviewReport)
        .filter(TechnicalInterviewReport.user_id == user_id)
        .order_by(desc(TechnicalInterviewReport.created_at))
        .limit(20)
        .all()
    )
    hr_report = (
        db.query(HRInterviewReport)
        .filter(HRInterviewReport.user_id == user_id)
        .order_by(desc(HRInterviewReport.created_at))
        .first()
    )
    placement_report = (
        db.query(PlacementRecommendation)
        .filter(PlacementRecommendation.user_id == user_id)
        .order_by(desc(PlacementRecommendation.created_at))
        .first()
    )

    coding_avg = safe_avg(coding_reports, "score")
    tech_avg = safe_avg(tech_reports, "overall_score")
    tech_comm_avg = safe_avg(tech_reports, "communication_score")

    return {
        "resume": resume_report,
        "codingReports": coding_reports,
        "techReports": tech_reports,
        "hr": hr_report,
        "placement": placement_report,
        "codingAvg": coding_avg,
        "techAvg": tech_avg,
        "techCommAvg": tech_comm_avg,
        "resumeReportId": resume_report.id if resume_report else None,
        "codingReportId": coding_reports[0].id if coding_reports else None,
        "technicalInterviewId": tech_reports[0].id if tech_reports else None,
        "hrInterviewId": hr_report.id if hr_report else None,
        "placementRecommendationId": placement_report.id if placement_report else None,
    }


def build_prompt(data: dict) -> str:
    resume = data["resume"]
    codingAvg = data["codingAvg"]
    techAvg = data["techAvg"]
    techCommAvg = data["techCommAvg"]
    hr = data["hr"]
    placement = data["placement"]

    lines = []

    if resume:
        lines.append(f"ATS Score: {resume.ats_score if resume.ats_score is not None else 'N/A'}/100")
        lines.append(f"Resume Score: {resume.resume_score if resume.resume_score is not None else 'N/A'}/100")
        lines.append(f"Recommended Role: {resume.recommended_role or 'N/A'}")
        lines.append(f"Skills: {', '.join(resume.skills[:10]) if resume.skills else 'N/A'}")
        lines.append(f"Resume Strengths: {'; '.join(resume.strengths[:3]) if resume.strengths else 'N/A'}")
        lines.append(f"Resume Weaknesses: {'; '.join(resume.weaknesses[:3]) if resume.weaknesses else 'N/A'}")

    if codingAvg is not None:
        lines.append(f"Coding Avg Score: {codingAvg}/10")
        verdicts = [r.verdict for r in data["codingReports"] if r.verdict]
        if verdicts:
            lines.append(f"Coding Verdicts: {', '.join(verdicts)}")

    if techAvg is not None:
        lines.append(f"Technical Interview Avg Score: {techAvg}/10")
        lines.append(f"Communication Score (Tech): {techCommAvg if techCommAvg is not None else 'N/A'}/10")
        strengths = [r.strength for r in data["techReports"] if r.strength][:3]
        weaknesses = [r.weakness for r in data["techReports"] if r.weakness][:3]
        if strengths:
            lines.append(f"Technical Strengths: {'; '.join(strengths)}")
        if weaknesses:
            lines.append(f"Technical Weaknesses: {'; '.join(weaknesses)}")

    if hr:
        lines.append(f"HR Interview Overall: {hr.overall_score if hr.overall_score is not None else 'N/A'}/10")
        lines.append(f"HR Communication: {hr.communication_score if hr.communication_score is not None else 'N/A'}/10")
        lines.append(f"HR Confidence: {hr.confidence_score if hr.confidence_score is not None else 'N/A'}/10")
        lines.append(f"HR Professionalism: {hr.professionalism_score if hr.professionalism_score is not None else 'N/A'}/10")
        lines.append(f"HR Recommendation: {hr.recommendation or 'N/A'}")

    if placement:
        lines.append(f"Placement Readiness: {placement.overall_readiness or 'N/A'}")
        lines.append(f"Estimated Placement Chance: {placement.estimated_placement_chance if placement.estimated_placement_chance is not None else 'N/A'}%")
        lines.append(f"Placement Recommended Role: {placement.recommended_role or 'N/A'}")
        if placement.strengths:
            lines.append(f"Placement Strengths: {'; '.join(placement.strengths[:3])}")
        if placement.skills_to_improve:
            lines.append(f"Skills to Improve: {', '.join(placement.skills_to_improve[:3])}")

    candidate_profile = "\n".join(lines)

    return f"""You are a senior technical recruiter making a final hiring decision.

Below is the complete AI-generated assessment of a candidate across all evaluation modules.

--- CANDIDATE ASSESSMENT ---
{candidate_profile or 'No assessment data available yet.'}
--- END ASSESSMENT ---

Based on this data, provide your recruiter recommendation.

CRITICAL: Return ONLY a valid JSON object. No markdown. No explanation. No text before or after.
Start with {{ and end with }}.

{{
  "overallScore": 7.5,
  "recommendation": "Hire",
  "riskLevel": "Low",
  "technicalReadiness": 8.0,
  "communicationReadiness": 7.5,
  "cultureFit": 8.0,
  "strengths": ["Quick learner", "Good Java knowledge", "Team player"],
  "weaknesses": ["Needs DSA practice", "Resume missing projects"],
  "summary": "The candidate has demonstrated strong technical readiness and good communication. Low risk, highly recommended for hire."
}}"""


def parse_groq_response(raw: str) -> dict:
    if not raw or not raw.strip():
        return None

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Extract from first { to last }
    first = raw.find("{")
    last = raw.rfind("}")
    if first != -1 and last > first:
        try:
            return json.loads(raw[first:last+1])
        except Exception:
            pass

    return None


async def generate_recruiter_recommendation(db: Session, candidate_id: int):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY not configured")

    data = collect_candidate_data(db, candidate_id)

    has_any_data = (
        data["resume"] is not None
        or data["codingAvg"] is not None
        or data["techAvg"] is not None
        or data["hr"] is not None
        or data["placement"] is not None
    )

    if not has_any_data:
        raise Exception(
            "No assessment data found for this candidate. "
            "Complete at least one evaluation module first."
        )

    prompt = build_prompt(data)

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}"
            },
            json={
                "model": "openai/gpt-oss-120b",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a JSON-only API. Respond with ONLY a valid JSON object. Never include markdown, code fences, or any text outside the JSON object."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 1500
            }
        )

        if res.status_code != 200:
            raise Exception(f"GROQ API error: {res.text}")

        groq_data = res.json()
        raw_text = groq_data["choices"][0]["message"]["content"].strip()
        ai_result = parse_groq_response(raw_text)

        if not ai_result:
            logger.error(f"[RecruiterAgent] JSON parse failed. Raw text: {raw_text[:400]}")
            raise Exception("Unable to parse AI response. Please try again.")

        VALID_RECOMMENDATIONS = ["Strong Hire", "Hire", "Maybe", "Need Another Interview", "Reject"]
        VALID_RISKS = ["Low", "Medium", "High"]

        def clamp(v, lo, hi):
            try:
                val = float(v)
                return min(hi, max(lo, val))
            except Exception:
                return 0.0

        recommendation = RecruiterRecommendation(
            candidate_id=candidate_id,
            overall_score=round(clamp(ai_result.get("overallScore"), 0, 10) * 10) / 10,
            technical_assessment=ai_result.get("technicalAssessment", ""),
            hr_assessment=ai_result.get("hrAssessment", ""),
            ai_summary=ai_result.get("summary", ""),
            recommended_role=ai_result.get("recommendedRole", ""),
            salary_range=ai_result.get("salaryRange", ""),
            hire_recommendation=ai_result.get("recommendation", "Maybe") if ai_result.get("recommendation") in VALID_RECOMMENDATIONS else "Maybe",
            strengths=ai_result.get("strengths", []),
            concerns=ai_result.get("weaknesses", []),
            skills_match=ai_result.get("skillsMatch", []),
            next_steps=ai_result.get("nextSteps", []),
            created_by_ai=True
        )

        db.add(recommendation)
        db.commit()
        db.refresh(recommendation)
        return recommendation


def get_latest_recruiter_recommendation(db: Session, candidate_id: int):
    return (
        db.query(RecruiterRecommendation)
        .filter(RecruiterRecommendation.candidate_id == candidate_id)
        .order_by(desc(RecruiterRecommendation.created_at))
        .first()
    )


def get_all_recommendations(db: Session, limit: int = 50):
    return (
        db.query(RecruiterRecommendation)
        .order_by(desc(RecruiterRecommendation.created_at))
        .limit(limit)
        .all()
    )
