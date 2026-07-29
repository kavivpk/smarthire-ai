"""
routers/resume.py — Resume analysis routes (replaces routes/resumeRoutes.js and controllers/resumeController.js)
"""
import os
import shutil
import httpx
import json
import asyncio
import pdfplumber
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.resume import Resume
from models.resume_report import ResumeReport
from middleware.auth import get_current_user
from services.ats_scoring import score_resume_text, IMPORTANT_SKILLS
from services.notification_service import notify

router = APIRouter(prefix="/api/resume", tags=["resume"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR, exist_ok=True)


async def analyze_with_groq(extracted_text: str, ats_score: float, matched_skills: list, missing_skills: list, suggestions: list, user_id: int, resume_id: int, file_name: str, db_session_factory):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    if not GROQ_API_KEY:
        return

    prompt = f"""You are an expert resume analyzer. Analyze the resume below and return ONLY a valid JSON object.

Resume Text:
{extracted_text[:3000]}

Matched Skills: {', '.join(matched_skills) if matched_skills else 'None'}
Missing Skills: {', '.join(missing_skills[:8]) if missing_skills else 'None'}
ATS Score: {ats_score}%

Return ONLY this JSON (no markdown, no explanation):
{{
  "skills": [],
  "projects": [],
  "education": [],
  "experience": [],
  "certifications": [],
  "strengths": [],
  "weaknesses": [],
  "resumeScore": 0,
  "recommendedRole": "",
  "improvementSuggestions": [],
  "overallFeedback": ""
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
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 800
                }
            )

            db = db_session_factory()
            ai_result = {}
            if res.status_code == 200:
                data = res.json()
                raw = data["choices"][0]["message"]["content"].strip()
                if raw.startswith("```"):
                    raw = raw.replace("```json", "").replace("```", "").strip()
                try:
                    ai_result = json.loads(raw)
                except Exception:
                    pass

            report = ResumeReport(
                user_id=user_id,
                resume_id=resume_id,
                file_name=file_name,
                skills=ai_result.get("skills", matched_skills),
                missing_skills=ai_result.get("missingSkills", missing_skills[:8]),
                projects=ai_result.get("projects", []),
                education=ai_result.get("education", []),
                experience=ai_result.get("experience", []),
                certifications=ai_result.get("certifications", []),
                strengths=ai_result.get("strengths", []),
                weaknesses=ai_result.get("weaknesses", []),
                ats_score=ats_score,
                resume_score=ai_result.get("resumeScore", ats_score),
                recommended_role=ai_result.get("recommendedRole", ""),
                improvement_suggestions=ai_result.get("improvementSuggestions", suggestions),
                overall_feedback=ai_result.get("overallFeedback", ""),
                created_by_ai=True
            )
            db.add(report)
            db.commit()

            # Trigger notification
            notify(
                db,
                user_id,
                "resume",
                "Resume Analyzed Successfully",
                f"Your resume scored {ats_score}% on the ATS check. {len(matched_skills)} skills matched."
            )
            db.close()
    except Exception as e:
        print("Resume AI analysis failed:", e)


@router.post("/analyze", status_code=status.HTTP_201_CREATED)
async def analyze_resume(
    resume: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only!")

    # Save temp file
    temp_path = os.path.join(UPLOADS_DIR, f"{current_user['id']}-{resume.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)

    try:
        extracted_text = ""
        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"

        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        extracted_text_lower = extracted_text.lower()

        # Score resume
        scoring = score_resume_text(extracted_text_lower, IMPORTANT_SKILLS)
        ats_score = scoring["ats_score"]
        matched_skills = scoring["matched_skills"]
        missing_skills = scoring["missing_skills"]
        suggestions = scoring["suggestions"]

        # Save to DB
        res_db = Resume(
            user_id=current_user["id"],
            file_name=resume.filename,
            extracted_text=extracted_text[:500], # store preview or first 500 chars to match Node.js
            ats_score=ats_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills[:8],
            suggestions=suggestions
        )
        db.add(res_db)
        db.commit()
        db.refresh(res_db)

        # Remove temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Run AI Deep analysis in background
        from database import SessionLocal
        asyncio.ensure_future(
            analyze_with_groq(
                extracted_text_lower,
                ats_score,
                matched_skills,
                missing_skills,
                suggestions,
                current_user["id"],
                res_db.id,
                resume.filename,
                SessionLocal
            )
        )

        return {
            "message": "Resume analyzed successfully",
            "atsScore": ats_score,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills[:8],
            "suggestions": suggestions,
            "resumeId": res_db.id
        }

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/history")
def get_resume_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user["id"])
        .order_by(Resume.created_at.desc())
        .limit(5)
        .all()
    )
    # Map model rows to match expected response format keys
    return [
        {
            "id": r.id,
            "fileName": r.file_name,
            "atsScore": r.ats_score,
            "matchedSkills": r.matched_skills,
            "missingSkills": r.missing_skills,
            "suggestions": r.suggestions,
            "createdAt": r.created_at
        } for r in resumes
    ]
