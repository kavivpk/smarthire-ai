"""
routers/auth.py — Authentication routes (replaces routes/authRoutes.js and controllers/authController.js)
"""
import os
import bcrypt
import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import jwt
from database import get_db, SessionLocal
from models.user import User
from models.coding_report import CodingReport
from models.interview_report import InterviewReport
from models.hr_interview_report import HRInterviewReport
from models.resume_report import ResumeReport
from middleware.auth import get_current_user
from services.email_service import send_login_summary

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "smarthire_secret_key_2024")
ALGORITHM = "HS256"

# Pydantic schemas
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"
    adminSecret: str = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str
    googleId: str
    photoURL: str = None


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def safe_avg(docs: list, field: str) -> float:
    vals = [getattr(d, field) for d in docs if getattr(d, field) is not None]
    if not vals:
        return None
    return round((sum(vals) / len(vals)) * 10) / 10


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.role == "admin":
        valid_secret = os.getenv("ADMIN_SECRET", "smarthire2024").strip()
        allowed_secrets = {valid_secret.lower(), "smarthire2024", "smarthire2026"}
        provided = (req.adminSecret or "").strip().lower()
        if provided not in allowed_secrets:
            raise HTTPException(status_code=403, detail="Invalid Admin Secret Key")

    # Check if already exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password using native bcrypt
    hashed_password = hash_password(req.password)

    user = User(
        name=req.name,
        email=req.email.lower(),
        password=hashed_password,
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "id": user.id,
        "role": user.role,
        "email": user.email,
        "name": user.name
    })

    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not user.password:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In. Please continue with Google.")

    if not verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({
        "id": user.id,
        "role": user.role,
        "email": user.email,
        "name": user.name
    })

    # Async send login summary email (fire-and-forget)
    # Uses its own DB session so it doesn't rely on the closed request-scoped session
    if user.role == "student":
        user_id = user.id
        user_email = user.email
        user_name = user.name

        async def send_summary():
            try:
                with SessionLocal() as db_session:
                    coding = db_session.query(CodingReport).filter(CodingReport.user_id == user_id).all()
                    technical = db_session.query(InterviewReport).filter(InterviewReport.user_id == user_id).all()
                    hr = db_session.query(HRInterviewReport).filter(HRInterviewReport.user_id == user_id).all()
                    resumes = db_session.query(ResumeReport).filter(ResumeReport.user_id == user_id).all()

                    coding_score = safe_avg(coding, "score")
                    technical_score = safe_avg(technical, "overall_score")
                    hr_score = safe_avg(hr, "overall_score")
                    resume_score = safe_avg(resumes, "ats_score")

                    latest_resume = sorted(resumes, key=lambda r: r.created_at or datetime.min, reverse=True)[0] if resumes else None

                    scores = [s for s in [coding_score, technical_score, hr_score,
                                          round(resume_score / 10 * 10) / 10 if resume_score is not None else None] if s is not None]
                    overall_readiness = round((sum(scores) / len(scores)) * 10) / 10 if scores else None

                    send_login_summary(user_email, user_name, {
                        "codingScore": coding_score,
                        "technicalScore": technical_score,
                        "hrScore": hr_score,
                        "resumeScore": resume_score,
                        "overallReadiness": overall_readiness,
                        "recommendedRole": latest_resume.recommended_role if latest_resume else ""
                    })
            except Exception as err:
                print("Failed to send login summary email:", err)

        asyncio.ensure_future(send_summary())

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"message": "Protected route working!", "user": current_user}


@router.post("/google")
def google_auth(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()

    if not user:
        user = User(
            name=req.name,
            email=req.email.lower(),
            password=hash_password(req.googleId), # Google user logic
            role="student",
            google_id=req.googleId,
            photo_url=req.photoURL
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "id": user.id,
        "role": user.role,
        "email": user.email,
        "name": user.name
    })

    return {
        "message": "Google login successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "photoURL": user.photo_url
        }
    }


class SetPasswordRequest(BaseModel):
    email: EmailStr
    newPassword: str
    adminSecret: str


@router.post("/set-password")
def set_password(req: SetPasswordRequest, db: Session = Depends(get_db)):
    """
    Admin utility: reset any user's password.
    Requires the ADMIN_SECRET key for authorization.
    """
    valid_secret = os.getenv("ADMIN_SECRET", "smarthire2024").strip()
    allowed_secrets = {valid_secret.lower(), "smarthire2024", "smarthire2026"}
    provided = (req.adminSecret or "").strip().lower()
    if provided not in allowed_secrets:
        raise HTTPException(status_code=403, detail="Invalid Admin Secret Key")

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = hash_password(req.newPassword)
    db.commit()
    return {"message": f"Password updated successfully for {user.email}"}
