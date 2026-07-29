"""
routers/bulk_screening.py — Bulk screening routes (replaces routes/bulkScreeningRoutes.js)
"""
import os
import shutil
import pdfplumber
from typing import List
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user
from services.ats_scoring import score_resume_text, IMPORTANT_SKILLS

router = APIRouter(prefix="/api/bulk-screening", tags=["bulk-screening"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR, exist_ok=True)


def parse_requirements(requirements_text: str) -> List[str]:
    if not requirements_text or not requirements_text.strip():
        return None

    if "," in requirements_text:
        return [s.strip() for s in requirements_text.split(",") if s.strip()]

    if "\n" in requirements_text:
        lines = [s.strip() for s in requirements_text.split("\n") if s.strip()]
        if len(lines) > 1:
            return lines

    text = requirements_text.lower().strip()
    found = [skill for skill in IMPORTANT_SKILLS if skill.lower() in text]
    if len(found) > 0:
        return found

    words = text.split()
    if len(words) <= 3:
        return [requirements_text.strip()]

    return None


@router.post("/analyze")
async def analyze_bulk(
    requirements: str = Form(""),
    resumes: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not resumes:
        raise HTTPException(status_code=400, detail="Please upload at least one resume PDF")

    required_skills = parse_requirements(requirements)
    results = []

    for file in resumes:
        if not file.filename.lower().endswith(".pdf"):
            results.append({
                "fileName": file.filename,
                "error": "Only PDF files are allowed"
            })
            continue

        temp_path = os.path.join(UPLOADS_DIR, f"bulk-{current_user['id']}-{file.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            extracted_text = ""
            with pdfplumber.open(temp_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text += text + "\n"

            if not extracted_text:
                results.append({
                    "fileName": file.filename,
                    "error": "Could not extract text from this file"
                })
                continue

            extracted_text_lower = extracted_text.lower()
            scoring = score_resume_text(extracted_text_lower, required_skills)

            results.append({
                "fileName": file.filename,
                "atsScore": scoring["ats_score"],
                "matchedSkills": scoring["matched_skills"],
                "missingSkills": scoring["missing_skills"][:10],
                "textPreview": extracted_text[:200]
            })

        except Exception:
            results.append({
                "fileName": file.filename,
                "error": "Could not parse this file"
            })
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    # Sort by atsScore descending
    results.sort(key=lambda x: x.get("atsScore", 0), reverse=True)

    return {"totalResumes": len(results), "results": results}
