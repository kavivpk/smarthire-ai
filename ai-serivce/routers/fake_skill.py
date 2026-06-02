# ai-serivce/routers/fake_skill.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx
import os
import json
import pdfplumber
import io

router = APIRouter()
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")

@router.post("/detect")
async def detect_fake_skills(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only!")

    # Extract text from PDF
    contents = await file.read()
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF read failed: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    prompt = f"""You are a strict, skeptical resume fraud detector. Analyze this resume text carefully.

RESUME TEXT:
{text[:3000]}

You MUST be critical and strict. Do NOT give everyone 100 score.

Analysis rules:
1. Skills listed WITHOUT any project/experience evidence → skills_without_evidence
2. Claims like "Expert in X" with no proof → suspicious_skills  
3. Contradictions (e.g. "5 years React" but graduated last year) → red_flags
4. Too many skills with no supporting projects → reduce credibility score
5. Generic resumes with just skill lists (no projects/experience) → score 40-60
6. Only give 80+ score if skills are backed by clear projects/work experience

Return ONLY this exact JSON (no extra text):
{{
  "credibility_score": <integer 0-100, be strict>,
  "verdict": "<one of: Credible / Needs Review / Suspicious / Fake>",
  "red_flags": [
    {{"severity": "<high/medium/low>", "detail": "<specific issue found>"}}
  ],
  "suspicious_skills": [
    {{"skill": "<skill>", "claim": "<what they claimed>", "warning": "<why suspicious>"}}
  ],
  "skills_without_evidence": [
    {{"skill": "<skill>", "reason": "No supporting project or experience found"}}
  ],
  "credible_skills": ["<skill1>", "<skill2>"],
  "recommendation": "<2 sentence actionable advice>"
}}

Be STRICT. If resume has only a skills section with no projects → score should be 30-50.
If resume has projects that match skills → 70-85.
Only give 90+ if everything is perfectly backed with evidence."""

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
            timeout=40.0
        )

    result = response.json()

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"]["message"])

    text_response = result["content"][0]["text"].strip()

    # Clean markdown fences
    if text_response.startswith("```"):
        text_response = text_response.split("```")[1]
        if text_response.startswith("json"):
            text_response = text_response[4:]

    try:
        return json.loads(text_response.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI response parse failed")