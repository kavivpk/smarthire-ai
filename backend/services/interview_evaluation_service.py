"""
services/interview_evaluation_service.py
Calls the existing Python AI-service for technical interview evaluation.
(Replaces services/interviewEvaluationService.js)
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000")


async def _call_ai_service(path: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{AI_SERVICE_URL}{path}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        if response.status_code != 200:
            raise Exception(f"AI service error: {response.text}")
        return response.json()


async def evaluate_technical_answer(payload: dict) -> dict:
    return await _call_ai_service("/api/agents/interview/evaluate", payload)


async def summarize_technical_interview(evaluations: list) -> dict:
    return await _call_ai_service("/api/agents/interview/summary", {"evaluations": evaluations})
