from fastapi import APIRouter
from pydantic import BaseModel
from services.prediction import predict_placement
from typing import List

router = APIRouter()

class StudentData(BaseModel):
    cgpa: float
    skills: List[str]
    projects: int
    internships: int
    backlogs: int
    communication: int  # 1-10
    technical_score: int  # 0-100

@router.post("/predict")
def get_prediction(data: StudentData):
    result = predict_placement(data.dict())
    return result