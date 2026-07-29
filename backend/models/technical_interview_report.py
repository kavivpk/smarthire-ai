"""models/technical_interview_report.py — TechnicalInterviewReport table"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class TechnicalInterviewReport(Base):
    __tablename__ = "technical_interview_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interview_id = Column(String(255), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    grammar_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    keyword_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    strength = Column(Text, nullable=True)
    weakness = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
