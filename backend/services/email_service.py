"""
services/email_service.py — Email sender (replaces utils/emailService.js)
Uses smtplib (sync) to send HTML emails.
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _send_email(to_email: str, subject: str, html_body: str):
    """Core synchronous send. All public helpers call this."""
    if not EMAIL_USER or not EMAIL_PASS:
        logger.warning("[EmailService] EMAIL_USER or EMAIL_PASS not configured — skipping email.")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = EMAIL_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        logger.info(f"[EmailService] Email sent to {to_email} — {subject}")
    except Exception as e:
        logger.error(f"[EmailService] Failed to send email to {to_email}: {e}")
        raise


# ── Login Summary Email ──────────────────────────────────────────────────────
def send_login_summary(to_email: str, name: str, data: dict):
    coding = data.get("codingScore")
    technical = data.get("technicalScore")
    hr = data.get("hrScore")
    resume = data.get("resumeScore")
    overall = data.get("overallReadiness")
    role = data.get("recommendedRole", "")

    def fmt(val):
        return f"{val}/10" if val is not None else "N/A"

    subject = "SmartHire AI — Your Performance Summary"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Hello {name}! 👋</h2>
      <p>Here's your SmartHire AI performance summary:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
        <tr style="background:#4F46E5;color:#fff;"><th style="padding:12px;">Module</th><th>Score</th></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Coding</td><td>{fmt(coding)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Technical Interview</td><td>{fmt(technical)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">HR Interview</td><td>{fmt(hr)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Resume ATS</td><td>{"N/A" if resume is None else f"{resume}%"}</td></tr>
        <tr style="font-weight:bold;background:#EEF2FF;"><td style="padding:10px;">Overall Readiness</td><td>{fmt(overall)}</td></tr>
      </table>
      {"<p style='margin-top:15px;'>Recommended Role: <strong>"+role+"</strong></p>" if role else ""}
      <p style="color:#6B7280;font-size:13px;margin-top:20px;">Keep practicing! 🚀 — SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Resume Analyzed Email ────────────────────────────────────────────────────
def send_resume_analyzed(to_email: str, name: str, data: dict):
    ats = data.get("atsScore", 0)
    matched = data.get("matchedSkills", [])
    missing = data.get("missingSkills", [])
    suggestions = data.get("suggestions", [])
    subject = "SmartHire AI — Resume Analysis Complete"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Resume Analysis Results 📄</h2>
      <p>Hi {name}, your resume has been analyzed!</p>
      <p><strong>ATS Score: {ats}%</strong></p>
      <p>✅ Matched Skills: {", ".join(matched) if matched else "None"}</p>
      <p>❌ Missing Skills: {", ".join(missing[:5]) if missing else "None"}</p>
      <ul>{"".join(f"<li>{s}</li>" for s in suggestions)}</ul>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Aptitude Result Email ────────────────────────────────────────────────────
def send_aptitude_result(to_email: str, name: str, data: dict):
    score = data.get("totalScore", 0)
    correct = data.get("correct", 0)
    total = data.get("total", 0)
    subject = "SmartHire AI — Aptitude Test Result"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Aptitude Test Completed 🧠</h2>
      <p>Hi {name},</p>
      <p>Score: <strong>{score}%</strong> ({correct}/{total} correct)</p>
      <p style="color:#6B7280;font-size:13px;">Keep practicing! — SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Coding Report Email ──────────────────────────────────────────────────────
def send_coding_report(to_email: str, name: str, data: dict):
    title = data.get("problemTitle", "Unknown")
    score = data.get("score", 0)
    verdict = data.get("verdict", "")
    passed = data.get("testCasesPassed", 0)
    total_tc = data.get("testCasesTotal", 0)
    feedback = data.get("feedback", "")
    subject = f"SmartHire AI — Coding: {title}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Coding Assessment Result 💻</h2>
      <p>Hi {name},</p>
      <p>Problem: <strong>{title}</strong></p>
      <p>Score: <strong>{score}/10</strong> | Verdict: <strong>{verdict}</strong></p>
      <p>Test Cases: {passed}/{total_tc} passed</p>
      <p>{feedback}</p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Technical Interview Report Email ────────────────────────────────────────
def send_technical_interview_report(to_email: str, name: str, data: dict):
    overall = data.get("overallScore", 0)
    subject = "SmartHire AI — Technical Interview Report"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Technical Interview Completed 🎯</h2>
      <p>Hi {name}, here is your technical interview report.</p>
      <p>Overall Score: <strong>{overall}/10</strong></p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── HR Interview Report Email ────────────────────────────────────────────────
def send_hr_interview_report(to_email: str, name: str, data: dict):
    overall = data.get("overallScore", 0)
    communication = data.get("communicationScore", 0)
    confidence = data.get("confidenceScore", 0)
    professionalism = data.get("professionalismScore", 0)
    recommendation = data.get("recommendation", "")
    subject = "SmartHire AI — HR Interview Report"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">HR Interview Completed 🤝</h2>
      <p>Hi {name},</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Communication</td><td>{communication}/10</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Confidence</td><td>{confidence}/10</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Professionalism</td><td>{professionalism}/10</td></tr>
        <tr style="font-weight:bold;"><td style="padding:10px;">Overall</td><td>{overall}/10</td></tr>
      </table>
      <p><strong>Recommendation:</strong> {recommendation}</p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Placement Recommendation Email ──────────────────────────────────────────
def send_placement_recommendation_report(to_email: str, name: str, data: dict):
    role = data.get("recommendedRole", "")
    chance = data.get("estimatedPlacementChance", 0)
    readiness = data.get("overallReadiness", "")
    subject = "SmartHire AI — Placement Recommendation Report"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Placement Recommendation 🎓</h2>
      <p>Hi {name},</p>
      <p>Recommended Role: <strong>{role}</strong></p>
      <p>Placement Readiness: <strong>{readiness}</strong></p>
      <p>Estimated Placement Chance: <strong>{chance}%</strong></p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Room Invite Email ────────────────────────────────────────────────────────
def send_room_invite(to_email: str, room_id: str, student_name: str, inviter_name: str):
    subject = "SmartHire AI — Interview Room Invitation"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">You've been invited to an interview! 🎤</h2>
      <p>Hi {student_name},</p>
      <p><strong>{inviter_name}</strong> has invited you to a live interview session.</p>
      <p>Room ID: <strong>{room_id}</strong></p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


# ── Combined AI Interview Result Email ──────────────────────────────────────
def send_combined_ai_interview_result(to_email: str, name: str, data: dict):
    aptitude = data.get("aptitude", {})
    coding = data.get("coding", {})
    technical = data.get("technical", {})
    overall = data.get("overall", {})
    subject = "SmartHire AI — AI Interview Session Complete"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">AI Interview Session Completed 🤖</h2>
      <p>Hi {name}, here are your combined results:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Aptitude Score</td><td>{aptitude.get("totalScore", "N/A")}%</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Coding Avg Score</td><td>{coding.get("avgScore", "N/A")}/10</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;">Technical Score</td><td>{technical.get("overallScore", "N/A")}/10</td></tr>
        <tr style="font-weight:bold;background:#EEF2FF;"><td style="padding:10px;">Overall</td><td>{overall.get("score", "N/A")}/{overall.get("outOf", 150)}</td></tr>
      </table>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)


def send_aptitude_only_result(to_email: str, name: str, data: dict):
    # data has correct, total, totalScore, categoryScores
    send_aptitude_result(to_email, name, data)


def send_coding_only_result(to_email: str, name: str, data: dict):
    score = data.get("avgScore", 0)
    solved = data.get("solved", 0)
    total = data.get("total", 0)
    subject = "SmartHire AI — Coding Assessment Result"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
      <h2 style="color:#4F46E5;">Coding Assessment Completed 💻</h2>
      <p>Hi {name},</p>
      <p>Solved: <strong>{solved}/{total}</strong> problems</p>
      <p>Average Score: <strong>{score}/10</strong></p>
      <p style="color:#6B7280;font-size:13px;">— SmartHire AI</p>
    </div>
    """
    _send_email(to_email, subject, html)

