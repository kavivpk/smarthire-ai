"""
services/analytics_service.py — Analytics logic (replaces analyticsService.js)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.coding_report import CodingReport
from models.interview_report import InterviewReport
from models.hr_interview_report import HRInterviewReport
from models.resume_report import ResumeReport
from models.interview import Interview
from models.resume import Resume


def safe_avg(values: list) -> float:
    nums = [v for v in values if isinstance(v, (int, float)) and v == v]
    if not nums:
        return 0
    return round(sum(nums) / len(nums) * 10) / 10


def get_user_analytics(db: Session, user_id: int) -> dict:
    coding_reports = db.query(CodingReport).filter(CodingReport.user_id == user_id).all()
    interview_reports = db.query(InterviewReport).filter(InterviewReport.user_id == user_id).all()
    hr_reports = db.query(HRInterviewReport).filter(HRInterviewReport.user_id == user_id).all()
    resume_reports = (
        db.query(ResumeReport)
        .filter(ResumeReport.user_id == user_id)
        .order_by(ResumeReport.created_at.desc())
        .all()
    )
    aptitude_interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id,
            Interview.topic.in_(["aptitude", "Aptitude", "mixed", "AI Live", "Admin Live"]),
        )
        .all()
    )

    coding_avg = safe_avg([r.score for r in coding_reports])
    technical_avg = safe_avg([r.overall_score for r in interview_reports])
    hr_avg = safe_avg([r.overall_score for r in hr_reports])
    resume_avg_raw = safe_avg([r.ats_score for r in resume_reports])
    aptitude_avg = safe_avg([r.total_score for r in aptitude_interviews])

    resume_norm = round(resume_avg_raw / 10 * 10) / 10
    scores = [s for s in [coding_avg, technical_avg, hr_avg, resume_norm, aptitude_avg] if s > 0]
    overall_readiness = round(sum(scores) / len(scores) * 10) / 10 if scores else 0

    latest_resume = resume_reports[0] if resume_reports else None
    skill_distribution = latest_resume.skills if latest_resume and latest_resume.skills else []
    recommended_role = latest_resume.recommended_role if latest_resume else ""

    total_assessments = (
        len(coding_reports)
        + len(interview_reports)
        + len(hr_reports)
        + len(resume_reports)
        + len(aptitude_interviews)
    )

    return {
        "totalAssessments": total_assessments,
        "codingAverage": coding_avg,
        "technicalInterviewAverage": technical_avg,
        "hrInterviewAverage": hr_avg,
        "resumeScoreAverage": resume_avg_raw,
        "aptitudeAverage": aptitude_avg,
        "overallPlacementReadiness": overall_readiness,
        "skillDistribution": skill_distribution,
        "recommendedRole": recommended_role,
        "counts": {
            "codingTests": len(coding_reports),
            "technicalInterviews": len(interview_reports),
            "hrInterviews": len(hr_reports),
            "resumeUploads": len(resume_reports),
            "aptitudeTests": len(aptitude_interviews),
        },
    }


def get_weekly_activity(db: Session, user_id: int) -> list:
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    days = {}
    for i in range(6, -1, -1):
        d = datetime.utcnow() - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        days[key] = {"date": key, "coding": 0, "technical": 0, "hr": 0, "resume": 0, "total": 0}

    for model, label in [
        (CodingReport, "coding"),
        (InterviewReport, "technical"),
        (HRInterviewReport, "hr"),
        (ResumeReport, "resume"),
    ]:
        rows = (
            db.query(func.date(model.created_at).label("day"), func.count().label("cnt"))
            .filter(model.user_id == user_id, model.created_at >= seven_days_ago)
            .group_by(func.date(model.created_at))
            .all()
        )
        for row in rows:
            key = str(row.day)
            if key in days:
                days[key][label] = row.cnt

    result = []
    for d in days.values():
        d["total"] = d["coding"] + d["technical"] + d["hr"] + d["resume"]
        result.append(d)
    return result


def get_recent_reports(db: Session, user_id: int, limit: int = 5) -> list:
    coding = (
        db.query(CodingReport)
        .filter(CodingReport.user_id == user_id)
        .order_by(CodingReport.created_at.desc())
        .limit(limit)
        .all()
    )
    technical = (
        db.query(InterviewReport)
        .filter(InterviewReport.user_id == user_id)
        .order_by(InterviewReport.created_at.desc())
        .limit(limit)
        .all()
    )
    hr = (
        db.query(HRInterviewReport)
        .filter(HRInterviewReport.user_id == user_id)
        .order_by(HRInterviewReport.created_at.desc())
        .limit(limit)
        .all()
    )
    resume = (
        db.query(ResumeReport)
        .filter(ResumeReport.user_id == user_id)
        .order_by(ResumeReport.created_at.desc())
        .limit(limit)
        .all()
    )

    all_reports = []
    for r in coding:
        all_reports.append({
            "reportType": "Coding",
            "problemTitle": r.problem_title,
            "score": r.score,
            "verdict": r.verdict,
            "language": r.language,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })
    for r in technical:
        all_reports.append({
            "reportType": "Technical Interview",
            "interviewType": r.interview_type,
            "overallScore": r.overall_score,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })
    for r in hr:
        all_reports.append({
            "reportType": "HR Interview",
            "interviewType": r.interview_type,
            "overallScore": r.overall_score,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })
    for r in resume:
        all_reports.append({
            "reportType": "Resume",
            "fileName": r.file_name,
            "atsScore": r.ats_score,
            "resumeScore": r.resume_score,
            "recommendedRole": r.recommended_role,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        })

    all_reports.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return all_reports[:limit]


def get_admin_analytics(db: Session) -> dict:
    total_coding = db.query(CodingReport).count()
    total_technical = db.query(InterviewReport).count()
    total_hr = db.query(HRInterviewReport).count()
    total_resume = db.query(ResumeReport).count()

    coding_avg_row = db.query(func.avg(CodingReport.score)).scalar() or 0
    tech_avg_row = db.query(func.avg(InterviewReport.overall_score)).scalar() or 0
    hr_avg_row = db.query(func.avg(HRInterviewReport.overall_score)).scalar() or 0
    resume_avg_row = db.query(func.avg(ResumeReport.ats_score)).scalar() or 0

    return {
        "totalAssessments": total_coding + total_technical + total_hr + total_resume,
        "counts": {
            "codingTests": total_coding,
            "technicalInterviews": total_technical,
            "hrInterviews": total_hr,
            "resumeUploads": total_resume,
        },
        "averages": {
            "coding": round(float(coding_avg_row) * 10) / 10,
            "technical": round(float(tech_avg_row) * 10) / 10,
            "hr": round(float(hr_avg_row) * 10) / 10,
            "resume": round(float(resume_avg_row) * 10) / 10,
        },
    }
