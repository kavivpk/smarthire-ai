from fastapi import APIRouter, UploadFile, File, HTTPException
import pdfplumber
import tempfile
import os
import json
import re
import requests
from dotenv import load_dotenv

router = APIRouter()

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@router.post("/generate-from-pdf")
async def generate_from_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF files only!")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured in AI Service .env")

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Extract text
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF file.")

        # Let's prompt Groq to generate questions from the text
        prompt = f"""You are an expert aptitude test creator. Read the following text extracted from a PDF and generate exactly 35 high-quality aptitude/reasoning/technical multiple choice questions based on it. If the text does not contain enough context for 35 questions, generate general hard aptitude/technical questions related to the topics mentioned in the text.

Text from PDF:
{text[:5000]}

Each question MUST have:
1. A category (e.g., 'Logical', 'Quantitative', 'Verbal', 'Technical')
2. The question text
3. Exactly 4 options
4. The correct answer index (0-indexed: 0 for options[0], 1 for options[1], etc.)

Respond ONLY with a valid JSON array (no markdown block, no explanation, no ```json wrapper), in this exact format:
[
  {{
    "id": 0,
    "category": "Quantitative",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 1
  }}
]
"""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
        body = {
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 6000
        }

        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        res_data = response.json()
        raw_content = res_data["choices"][0]["message"]["content"].strip()

        # Clean the output if it has markdown block ticks
        raw_content = re.sub(r"^```json\s*", "", raw_content, flags=re.IGNORECASE)
        raw_content = re.sub(r"^```\s*", "", raw_content)
        raw_content = re.sub(r"```\s*$", "", raw_content)
        raw_content = raw_content.strip()

        try:
            questions = json.loads(raw_content)
            # Ensure each question has a unique id
            for i, q in enumerate(questions):
                q["id"] = i
            return {"questions": questions, "total": len(questions)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response as JSON. Raw: {raw_content}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
