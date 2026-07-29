"""models/aptitude_question.py — AptitudeQuestion table (replaces Mongoose AptitudeQuestion.js)"""
from sqlalchemy import Column, Integer, String, Enum, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class AptitudeQuestion(Base):
    __tablename__ = "aptitude_questions"

    id = Column(Integer, primary_key=True, index=True)
    section = Column(
        Enum("Analytical", "Logical", "Technical", "General"),
        default="General",
        nullable=False,
    )
    question = Column(String(1000), nullable=False)
    options = Column(JSON, nullable=False)   # list of 4 strings
    answer = Column(Integer, nullable=False)  # index 0–3
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
