"""models/coding_report.py — CodingReport table (replaces Mongoose CodingReport.js)"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base


class CodingReport(Base):
    __tablename__ = "coding_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    problem_id = Column(Integer, nullable=False)
    problem_title = Column(String(500), nullable=False)
    language = Column(String(100), nullable=False)
    code = Column(Text, nullable=False)
    score = Column(Float, default=0)        # 0–10
    verdict = Column(String(255), default="")
    test_cases_passed = Column(Integer, default=0)
    test_cases_total = Column(Integer, default=0)
    test_case_results = Column(JSON, default=list)  # [{input, expected, actual, status}]
    feedback = Column(Text, default="")
    hints = Column(Text, default="")
    time_complexity = Column(String(100), default="")
    space_complexity = Column(String(100), default="")
    code_quality = Column(Float, nullable=True)
    readability = Column(Float, nullable=True)
    optimization = Column(Float, nullable=True)
    edge_cases = Column(Float, nullable=True)
    best_practices = Column(Float, nullable=True)
    strengths = Column(Text, default="")
    weaknesses = Column(Text, default="")
    recommendations = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
