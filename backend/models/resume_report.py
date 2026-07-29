"""models/resume_report.py — ResumeReport table (replaces Mongoose ResumeReport.js)"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class ResumeReport(Base):
    __tablename__ = "resume_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    file_name = Column(String(500), default="")
    skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    ats_score = Column(Float, default=0)
    resume_score = Column(Float, default=0)
    recommended_role = Column(String(255), default="")
    improvement_suggestions = Column(JSON, default=list)
    overall_feedback = Column(Text, default="")
    created_by_ai = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
