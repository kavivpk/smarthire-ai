"""models/recruiter_recommendation.py — RecruiterRecommendation table"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class RecruiterRecommendation(Base):
    __tablename__ = "recruiter_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    overall_score = Column(Float, default=0)
    hire_recommendation = Column(String(255), default="")
    strengths = Column(JSON, default=list)
    concerns = Column(JSON, default=list)
    skills_match = Column(JSON, default=list)
    experience_summary = Column(Text, default="")
    technical_assessment = Column(Text, default="")
    hr_assessment = Column(Text, default="")
    ai_summary = Column(Text, default="")
    recommended_role = Column(String(255), default="")
    salary_range = Column(String(255), default="")
    next_steps = Column(JSON, default=list)
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
