"""
routers/recruiter.py — Recruiter agent routes (replaces routes/recruiterRoutes.js and controllers/recruiterAgentController.js)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user, require_admin
from services.recruiter_agent_service import (
    generate_recruiter_recommendation,
    get_latest_recruiter_recommendation,
    get_all_recommendations
)
from models.user import User

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])

@router.post("/generate/{candidate_id}", status_code=status.HTTP_201_CREATED)
async def generate_recommendation(
    candidate_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_id_val = current_user["id"] if candidate_id == "me" else int(candidate_id)
        result = await generate_recruiter_recommendation(db, user_id_val)
        return {
            "id": result.id,
            "overallScore": result.overall_score,
            "recommendation": result.hire_recommendation,
            "strengths": result.strengths,
            "weaknesses": result.concerns,
            "skillsMatch": result.skills_match,
            "summary": result.ai_summary,
            "createdAt": result.created_at
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/latest/{candidate_id}")
def get_latest(
    candidate_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id_val = current_user["id"] if candidate_id == "me" else int(candidate_id)
    result = get_latest_recruiter_recommendation(db, user_id_val)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="No recruiter recommendation found. Generate one first."
        )
    return {
        "id": result.id,
        "overallScore": result.overall_score,
        "recommendation": result.hire_recommendation,
        "strengths": result.strengths,
        "weaknesses": result.concerns,
        "skillsMatch": result.skills_match,
        "summary": result.ai_summary,
        "createdAt": result.created_at
    }


@router.get("/all")
def get_all(
    limit: int = Query(50, ge=1, le=200),
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    results = get_all_recommendations(db, limit)
    response_data = []
    for r in results:
        # Populate candidate name and email
        user = db.query(User).filter(User.id == r.candidate_id).first()
        response_data.append({
            "id": r.id,
            "overallScore": r.overall_score,
            "recommendation": r.hire_recommendation,
            "strengths": r.strengths,
            "weaknesses": r.concerns,
            "skillsMatch": r.skills_match,
            "summary": r.ai_summary,
            "createdAt": r.created_at,
            "candidateId": {
                "id": user.id if user else r.candidate_id,
                "name": user.name if user else "Unknown",
                "email": user.email if user else "Unknown"
            }
        })
    return response_data
