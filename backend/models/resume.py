"""models/resume.py — Resume table (replaces Mongoose Resume.js)"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String(500), nullable=True)
    extracted_text = Column(Text, nullable=True)
    ats_score = Column(Float, nullable=True)
    matched_skills = Column(JSON, default=list)   # list of strings
    missing_skills = Column(JSON, default=list)   # list of strings
    suggestions = Column(JSON, default=list)      # list of strings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
