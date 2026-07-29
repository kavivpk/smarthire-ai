"""
routers/placement.py — Placement recommendation routes (replaces routes/placementRecommendationRoutes.js)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user
from services.placement_recommendation_service import (
    generate_and_save_recommendation,
    get_latest_recommendation
)

router = APIRouter(prefix="/api/placement-recommendation", tags=["placement"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_recommendation(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = await generate_and_save_recommendation(db, current_user["id"])

    # If it is a dictionary containing error message (no assessment data)
    if isinstance(result, dict) and "message" in result:
        raise HTTPException(status_code=400, detail=result["message"])

    return {
        "id": result.id,
        "aptitudeScore": result.aptitude_score,
        "codingScore": result.coding_score,
        "technicalScore": result.technical_score,
        "hrScore": result.hr_score,
        "resumeScore": result.resume_score,
        "overallScore": result.overall_score,
        "overallReadiness": result.overall_readiness,
        "recommendedRole": result.recommended_role,
        "recommendedCompanies": result.recommended_companies,
        "strengths": result.strengths,
        "weaknesses": result.weaknesses,
        "skillsToImprove": result.skills_to_improve,
        "learningRoadmap": result.learning_roadmap,
        "estimatedPlacementChance": result.estimated_placement_chance,
        "aiSummary": result.ai_summary,
        "createdAt": result.created_at
    }


@router.get("/latest")
def get_latest(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    recommendation = get_latest_recommendation(db, current_user["id"])
    if not recommendation:
        raise HTTPException(
            status_code=404,
            detail="No recommendation found. Please generate one first."
        )

    return {
        "id": recommendation.id,
        "aptitudeScore": recommendation.aptitude_score,
        "codingScore": recommendation.coding_score,
        "technicalScore": recommendation.technical_score,
        "hrScore": recommendation.hr_score,
        "resumeScore": recommendation.resume_score,
        "overallScore": recommendation.overall_score,
        "overallReadiness": recommendation.overall_readiness,
        "recommendedRole": recommendation.recommended_role,
        "recommendedCompanies": recommendation.recommended_companies,
        "strengths": recommendation.strengths,
        "weaknesses": recommendation.weaknesses,
        "skillsToImprove": recommendation.skills_to_improve,
        "learningRoadmap": recommendation.learning_roadmap,
        "estimatedPlacementChance": recommendation.estimated_placement_chance,
        "aiSummary": recommendation.ai_summary,
        "createdAt": recommendation.created_at
    }
