"""
routers/admin.py — Admin routes (replaces routes/adminRoutes.js and controllers/adminController.js)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from database import get_db
from middleware.auth import require_admin
from models.user import User
from models.resume import Resume
from models.interview import Interview
from models.aptitude_question import AptitudeQuestion
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AddAptitudeRequest(BaseModel):
    section: str
    question: str
    options: List[str]
    answer: int

@router.get("/students")
def get_students(db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    students = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(desc(User.created_at))
        .all()
    )

    # Enrich students with stats
    enriched = []
    for s in students:
        interviews_count = db.query(Interview).filter(Interview.user_id == s.id).count()
        
        # Calculate average interview score
        scores = db.query(Interview.total_score).filter(Interview.user_id == s.id).all()
        avg_score_val = sum(sc[0] for sc in scores if sc[0] is not None) / len(scores) if scores else 0
        
        # Latest resume score
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == s.id)
            .order_by(desc(Resume.created_at))
            .first()
        )

        enriched.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "role": s.role,
            "photoURL": s.photo_url,
            "createdAt": s.created_at,
            "interviewsTaken": interviews_count,
            "avgInterviewScore": f"{round(avg_score_val * 10)}%" if scores else "N/A",
            "resumeScore": f"{round(latest_resume.ats_score)}%" if latest_resume else "N/A"
        })
    return enriched


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    total_students = db.query(User).filter(User.role == "student").count()
    total_resumes = db.query(Resume).count()
    total_interviews = db.query(Interview).count()

    # Average ATS score
    ats_scores = db.query(Resume.ats_score).all()
    avg_ats = round(sum(r[0] for r in ats_scores if r[0] is not None) / len(ats_scores)) if ats_scores else 0

    # Average interview score
    interview_scores = db.query(Interview.total_score).all()
    avg_interview = round(sum(i[0] for i in interview_scores if i[0] is not None) / len(interview_scores)) if interview_scores else 0

    # Monthly registrations (last 6 months)
    # SQLite/MySQL/PostgreSQL date grouping has some variance, but we can do a general group
    # We will do a generic SQLAlchemy group by month/year
    # For MySQL or SQLite compatibility we can query all students and group in python to keep it robust across all DB dialects
    from datetime import datetime, timedelta
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    users = (
        db.query(User.created_at)
        .filter(User.created_at >= six_months_ago, User.role == "student")
        .all()
    )

    monthly_map = {}
    for u in users:
        if u.created_at:
            key = (u.created_at.year, u.created_at.month)
            monthly_map[key] = monthly_map.get(key, 0) + 1

    monthly_data = []
    for (year, month), count in sorted(monthly_map.items()):
        monthly_data.append({
            "_id": {"month": month, "year": year},
            "count": count
        })

    # Topic-wise interview distribution
    topic_counts = (
        db.query(Interview.topic, func.count(Interview.id))
        .group_by(Interview.topic)
        .all()
    )
    topic_data = [{"_id": t[0], "count": t[1]} for t in topic_counts]

    # ATS score distribution buckets [0-25, 25-50, 50-75, 75-100]
    resumes = db.query(Resume.ats_score).all()
    buckets = {"0": 0, "25": 0, "50": 0, "75": 0}
    for r in resumes:
        if r[0] is not None:
            val = r[0]
            if val < 25:
                buckets["0"] += 1
            elif val < 50:
                buckets["25"] += 1
            elif val < 75:
                buckets["50"] += 1
            else:
                buckets["75"] += 1

    ats_distribution = [
        {"_id": 0, "count": buckets["0"]},
        {"_id": 25, "count": buckets["25"]},
        {"_id": 50, "count": buckets["50"]},
        {"_id": 75, "count": buckets["75"]}
    ]

    return {
        "totalStudents": total_students,
        "totalResumes": total_resumes,
        "totalInterviews": total_interviews,
        "avgATS": avg_ats,
        "avgInterview": avg_interview,
        "monthlyData": monthly_data,
        "topicData": topic_data,
        "atsDistribution": ats_distribution
    }


@router.get("/students/{student_id}")
def get_student_detail(student_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == student_id)
        .order_by(desc(Resume.created_at))
        .all()
    )
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == student_id)
        .order_by(desc(Interview.created_at))
        .all()
    )

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "role": student.role,
            "photoURL": student.photo_url,
            "createdAt": student.created_at
        },
        "resumes": [
            {
                "id": r.id,
                "fileName": r.file_name,
                "atsScore": r.ats_score,
                "matchedSkills": r.matched_skills,
                "missingSkills": r.missing_skills,
                "suggestions": r.suggestions,
                "createdAt": r.created_at
            } for r in resumes
        ],
        "interviews": [
            {
                "id": i.id,
                "topic": i.topic,
                "questions": i.questions,
                "totalScore": i.total_score,
                "totalQuestions": i.total_questions,
                "completedAt": i.completed_at
            } for i in interviews
        ]
    }


@router.post("/questions/aptitude")
def add_aptitude_question(req: AddAptitudeRequest, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    if req.section not in ["Analytical", "Logical", "Technical", "General", "Verbal", "Quantitative"]:
        raise HTTPException(status_code=400, detail="Invalid section name")
    
    if len(req.options) != 4:
        raise HTTPException(status_code=400, detail="Options list must contain exactly 4 options")

    if req.answer < 0 or req.answer > 3:
        raise HTTPException(status_code=400, detail="Answer index must be between 0 and 3")

    q = AptitudeQuestion(
        section=req.section,
        question=req.question,
        options=req.options,
        answer=req.answer
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    return {"message": "Question added successfully", "data": {
        "id": q.id,
        "section": q.section,
        "question": q.question,
        "options": q.options,
        "answer": q.answer
    }}


@router.get("/all-interviews")
def get_all_interviews(db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    """Return all interviews across all students with student name info."""
    interviews = (
        db.query(Interview)
        .order_by(desc(Interview.created_at))
        .limit(200)
        .all()
    )

    result = []
    for iv in interviews:
        student = db.query(User).filter(User.id == iv.user_id).first()
        result.append({
            "id": iv.id,
            "studentName": student.name if student else "Unknown",
            "studentEmail": student.email if student else "",
            "topic": iv.topic,
            "totalScore": iv.total_score,
            "totalQuestions": iv.total_questions,
            "completedAt": iv.completed_at,
            "createdAt": iv.created_at,
        })
    return result


class AnnounceRequest(BaseModel):
    title: str
    message: str


@router.post("/announce")
def send_announcement(req: AnnounceRequest, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    """Send a notification to all students."""
    from services.notification_service import notify
    students = db.query(User).filter(User.role == "student").all()
    for student in students:
        notify(db, student.id, "announcement", req.title, req.message, None)
    return {"message": f"Announcement sent to {len(students)} students", "count": len(students)}


@router.get("/questions/aptitude")
def get_aptitude_questions(db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    """List all admin-added aptitude questions."""
    questions = db.query(AptitudeQuestion).order_by(desc(AptitudeQuestion.id)).all()
    return [
        {
            "id": q.id,
            "section": q.section,
            "question": q.question,
            "options": q.options,
            "answer": q.answer
        } for q in questions
    ]


@router.delete("/questions/aptitude/{question_id}")
def delete_aptitude_question(question_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(require_admin)):
    """Delete an admin-added aptitude question."""
    q = db.query(AptitudeQuestion).filter(AptitudeQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}
