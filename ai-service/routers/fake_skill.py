from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
import os
import json
import re
import pdfplumber
import io
from groq import Groq

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_json(raw: str) -> dict:
    """
    Robustly extract a JSON object from an LLM response that may contain:
    - ```json ... ``` fences
    - ``` ... ``` fences
    - Plain text before/after the JSON object
    - Explanatory text mixed in

    Strategy (in order):
    1. Strip all markdown fences, try json.loads on the cleaned string.
    2. Find the first '{' and last '}', extract that substring, try json.loads.
    3. Use regex to find a JSON object pattern, try json.loads on each candidate.
    4. Return None if all strategies fail.
    """
    if not raw or not raw.strip():
        return None

    # ── Strategy 1: strip markdown fences then parse ───────────────────────
    cleaned = raw.strip()

    # Remove ```json ... ``` or ``` ... ``` fences (greedy across newlines)
    cleaned = re.sub(r'```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'```', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        pass

    # ── Strategy 2: brace extraction ──────────────────────────────────────
    first_brace = raw.find('{')
    last_brace = raw.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = raw[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass

    # ── Strategy 3: regex search for JSON object ──────────────────────────
    # Find all substrings that look like {...} objects (non-greedy won't work
    # for nested JSON, so use a balanced-brace finder)
    candidates = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', raw, re.DOTALL)
    for candidate in reversed(candidates):  # try the largest match last=first
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            continue

    return None


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

CRITICAL INSTRUCTION:
Return ONLY a raw JSON object. No markdown. No code fences. No explanation. No preamble.
Start your response with {{ and end with }}. Nothing before or after.

Output this exact JSON structure:
{{
  "credibility_score": <integer 0-100, be very strict>,
  "verdict": "<one of: Credible | Needs Review | Suspicious | Fake>",
  "red_flags": [
    {{"severity": "<high|medium|low>", "detail": "<specific issue found in resume>"}}
  ],
  "suspicious_skills": [
    {{"skill": "<skill name>", "claim": "<what was claimed>", "warning": "<why suspicious>"}}
  ],
  "skills_without_evidence": [
    {{"skill": "<skill name>", "reason": "No supporting project or experience found"}}
  ],
  "credible_skills": ["<skill1>", "<skill2>"],
  "recommendation": "<2 sentence specific advice based on THIS resume>"
}}"""

    raw_response = ""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a JSON-only API. You must respond with ONLY a valid JSON object. "
                        "Never include markdown, code fences, explanations, or any text outside the JSON object. "
                        "Start your response with { and end with }."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )

        raw_response = response.choices[0].message.content.strip()
        result = extract_json(raw_response)

        if result is None:
            # Log for debugging but never expose raw LLM output to client
            print(f"[FakeSkill] JSON parse failed. Raw response (first 500 chars):\n{raw_response[:500]}")
            raise HTTPException(
                status_code=500,
                detail="Unable to parse AI response. Please try again."
            )

        # Ensure all expected fields exist with safe defaults
        result.setdefault("credibility_score", 50)
        result.setdefault("verdict", "Needs Review")
        result.setdefault("red_flags", [])
        result.setdefault("suspicious_skills", [])
        result.setdefault("skills_without_evidence", [])
        result.setdefault("credible_skills", [])
        result.setdefault("recommendation", "Please review the resume manually.")

        # Clamp credibility_score to valid range
        try:
            result["credibility_score"] = max(0, min(100, int(result["credibility_score"])))
        except (TypeError, ValueError):
            result["credibility_score"] = 50

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FakeSkill] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
