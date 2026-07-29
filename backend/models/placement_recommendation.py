"""models/placement_recommendation.py — PlacementRecommendation table"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class PlacementRecommendation(Base):
    __tablename__ = "placement_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    aptitude_score = Column(Float, default=0)
    coding_score = Column(Float, default=0)
    technical_score = Column(Float, default=0)
    hr_score = Column(Float, default=0)
    resume_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    overall_readiness = Column(String(255), default="Not Evaluated")
    recommended_role = Column(String(255), default="")
    recommended_companies = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    skills_to_improve = Column(JSON, default=list)
    learning_roadmap = Column(JSON, default=list)
    estimated_placement_chance = Column(Float, default=0)  # 0–100
    ai_summary = Column(Text, default="")
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
