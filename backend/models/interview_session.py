"""models/interview_session.py — InterviewSession table (replaces Mongoose InterviewSession.js)"""
from sqlalchemy import Column, Integer, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    aptitude_result = Column(JSON, default=dict)   # {correct, total, totalScore, categoryScores}
    coding_result = Column(JSON, default=dict)     # {solved, total, avgScore, results}
    technical_result = Column(JSON, default=dict)  # {overallScore, totalScore}
    overall_score = Column(JSON, default=dict)     # {score, outOf, percent}
    violations = Column(Integer, default=0)
    disqualified = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
