"""models/interview_report.py — InterviewReport table (replaces Mongoose InterviewReport.js)"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interview_id = Column(String(255), nullable=False, index=True)
    interview_type = Column(String(100), default="Technical")
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=list)
    ai_feedback = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    technical_score = Column(Float, default=0)
    problem_solving_score = Column(Float, default=0)
    communication_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    recommendation = Column(Text, default="")
    duration = Column(Integer, default=0)  # seconds
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
