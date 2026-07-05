from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from agents.interview.interview_agent import evaluate_answer
from agents.interview.report import build_summary

router = APIRouter()


class InterviewEvaluationRequest(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    resume: Optional[str] = ""
    interviewId: Optional[str] = None
    userId: Optional[str] = None
    keywords: List[str] = []
    expectedAnswer: Optional[str] = None


class InterviewSummaryRequest(BaseModel):
    evaluations: List[dict] = []


@router.post("/evaluate")
async def evaluate_interview_answer(payload: InterviewEvaluationRequest):
    try:
        return evaluate_answer(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/summary")
async def summarize_interview(payload: InterviewSummaryRequest):
    try:
        return build_summary(payload.evaluations)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
