# ai-service/routers/fake_skill.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
import json
import pdfplumber
import io
from groq import Groq

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/detect")
async def detect_fake_skills(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only!")

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

    prompt = f"""You are an extremely strict resume fraud detector. Analyze this resume.

RESUME TEXT:
{text[:3000]}

STRICT SCORING RULES — Follow exactly:
- Resume has ONLY skills list, NO projects at all → score 20-35
- Resume has 1 small project with few skills → score 36-50
- Resume has projects but skills don't match projects → score 40-55
- Resume has internship only, no personal projects → score 50-65
- Resume has 2-3 projects matching skills → score 60-72
- Resume has strong projects + internship + matching skills → score 73-82
- Resume has GitHub links + deployed projects + internship + all skills backed → score 83-90
- Perfect resume with publications/awards/everything proven → score 91-100

IMPORTANT: A fresher resume with internship and 2-3 projects MAX score is 75.
Never give above 75 unless GitHub links or deployed project URLs are present in resume.
Current resume score must reflect ACTUAL content strictly.

Return ONLY valid JSON:
{{
  "credibility_score": <integer, be very strict>,
  "verdict": "<Credible or Needs Review or Suspicious or Fake>",
  "red_flags": [
    {{"severity": "<high/medium/low>", "detail": "<specific issue found in resume>"}}
  ],
  "suspicious_skills": [
    {{"skill": "<skill>", "claim": "<what claimed>", "warning": "<why suspicious>"}}
  ],
  "skills_without_evidence": [
    {{"skill": "<skill>", "reason": "No supporting project or experience found"}}
  ],
  "credible_skills": ["<skill1>", "<skill2>"],
  "recommendation": "<2 sentence specific advice based on THIS resume>"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000
        )

        text_response = response.choices[0].message.content.strip()

        if text_response.startswith("```"):
            text_response = text_response.split("```")[1]
            if text_response.startswith("json"):
                text_response = text_response[4:]

        return json.loads(text_response.strip())

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI response parse failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))