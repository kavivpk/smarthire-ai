# ai-service/routers/roadmap.py

from fastapi import APIRouter
import httpx
import os
import json

router = APIRouter()

CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")

@router.post("/generate-roadmap")
async def generate_roadmap(data: dict):
    skills = data.get("skills", [])
    target_role = data.get("targetRole", "Software Developer")

    prompt = f"""
You are a career guidance expert. A student has these current skills: {', '.join(skills)}.
Their target role is: {target_role}.

Generate a 8-week career roadmap JSON with this exact structure:
{{
  "title": "Roadmap title",
  "totalWeeks": 8,
  "weeks": [
    {{
      "week": 1,
      "title": "Week title",
      "focus": "Main topic to learn",
      "tasks": ["task 1", "task 2", "task 3"],
      "resources": ["Resource name 1", "Resource name 2"]
    }}
  ],
  "missingSkills": ["skill1", "skill2"],
  "strongSkills": ["skill1", "skill2"]
}}

Return ONLY valid JSON. No explanation text outside the JSON.
"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-3-5-haiku-20241022",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30.0
        )

    result = response.json()
    text = result["content"][0]["text"]

    # Clean markdown fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    roadmap = json.loads(text.strip())
    return roadmap