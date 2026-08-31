"""
routers/admin.py — Admin routes (replaces routes/adminRoutes.js and controllers/adminController.js)
"""
import os
import io
import json
import re
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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

try:
    import pdfplumber  # type: ignore
except ImportError:
    pdfplumber = None

try:
    import docx  # type: ignore
except ImportError:
    docx = None

try:
    from groq import Groq  # type: ignore
except ImportError:
    Groq = None

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


def _extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT file bytes."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
    if ext == "pdf":
        if not pdfplumber:
            raise HTTPException(status_code=500, detail="pdfplumber module is not available")
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {e}")
    elif ext in ("docx", "doc"):
        if not docx:
            raise HTTPException(status_code=500, detail="python-docx module is not available")
        try:
            doc = docx.Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read DOCX: {e}")
    else:
        # Plain text / CSV / any text format
        try:
            return content.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")


@router.post("/questions/aptitude/import")
async def import_questions_from_file(
    file: UploadFile = File(...),
    section: str = Form("Analytical"),
    db: Session = Depends(get_db),
    current_admin: dict = Depends(require_admin)
):
    """
    Upload a PDF, DOCX, or TXT file containing aptitude MCQ questions.
    The AI will parse them automatically and import into the database.
    Expected MCQ format in document:
      Q1. <question>
      A) <opt>  B) <opt>  C) <opt>  D) <opt>
      Answer: A
    """
    allowed_extensions = {"pdf", "docx", "doc", "txt"}
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Use PDF, DOCX, DOC, or TXT."
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    raw_text = _extract_text_from_file(content, file.filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file")

    # Truncate to avoid token overflow
    raw_text = raw_text[:12000]

    # Use Groq LLM to parse questions
    if not Groq:
        raise HTTPException(status_code=500, detail="groq library is not installed")
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    prompt = f"""You are a question parser. Extract ALL multiple-choice questions from the text below.
Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[
  {{
    "question": "Full question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": 0
  }}
]
- "answer" is the 0-based index of the correct option (0=A, 1=B, 2=C, 3=D)
- If you cannot determine the answer, use 0
- Only include questions with exactly 4 options
- Remove question numbers from the question text

TEXT TO PARSE:
{raw_text}"""

    try:
        resp = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=4096,
        )
        raw_response = resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {e}")

    # Extract JSON array robustly
    json_match = re.search(r"\[[\s\S]*\]", raw_response)
    if not json_match:
        raise HTTPException(status_code=422, detail="AI could not find any MCQ questions in the document")

    try:
        parsed_questions = json.loads(json_match.group())
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"AI returned malformed JSON: {e}")

    if not isinstance(parsed_questions, list) or len(parsed_questions) == 0:
        raise HTTPException(status_code=422, detail="No questions found in document")

    valid_sections = {"Analytical", "Logical", "Technical", "General", "Verbal", "Quantitative"}
    if section not in valid_sections:
        section = "Analytical"

    imported = []
    skipped = 0
    for item in parsed_questions:
        try:
            q_text = str(item.get("question", "")).strip()
            opts = item.get("options", [])
            ans = int(item.get("answer", 0))

            if not q_text or len(opts) != 4 or not (0 <= ans <= 3):
                skipped += 1
                continue

            opts = [str(o).strip() for o in opts]
            q = AptitudeQuestion(section=section, question=q_text, options=opts, answer=ans)
            db.add(q)
            db.flush()
            imported.append({"id": q.id, "question": q_text})
        except Exception:
            skipped += 1
            continue

    db.commit()

    return {
        "message": f"Successfully imported {len(imported)} questions" + (f" ({skipped} skipped)" if skipped else ""),
        "imported": len(imported),
        "skipped": skipped,
        "questions": imported
    }



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
