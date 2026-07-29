"""models/hr_interview_report.py — HRInterviewReport table (replaces Mongoose HRInterviewReport.js)"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class HRInterviewReport(Base):
    __tablename__ = "hr_interview_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interview_id = Column(String(255), nullable=False, index=True)
    interview_type = Column(String(100), default="HR")
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=list)
    ai_feedback = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    communication_score = Column(Float, default=0)
    confidence_score = Column(Float, default=0)
    professionalism_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    recommendation = Column(Text, default="")
    duration = Column(Integer, default=0)  # seconds
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
