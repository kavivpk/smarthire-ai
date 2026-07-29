"""
main.py — FastAPI server + Socket.io (ASGI) entry point (replaces server.js)
"""
import os
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load models to register them on SQLAlchemy metadata
from database import engine, Base
import models.user
import models.interview
import models.interview_report
import models.hr_interview_report
import models.technical_interview_report
import models.resume
import models.resume_report
import models.coding_report
import models.aptitude_question
import models.interview_session
import models.placement_recommendation
import models.notification
import models.recruiter_recommendation

# Create database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized successfully.")
except Exception as e:
    print(f"Failed to synchronize database tables: {e}")

load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="SmartHire AI Backend", version="1.0.0")

# Setup CORS
frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [url.strip() for url in frontend_urls.split(",") if url.strip()]
# Also add localhost wildcards or dynamic local origins to match Node.js dynamic CORS
origins.append("http://localhost:5173")
origins.append("http://localhost:5174")
origins.append("http://localhost:5175")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import Routers
from routers import auth, resume, interview, admin, analytics, notifications, placement, recruiter, bulk_screening

# Mount Routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(placement.router)
app.include_router(recruiter.router)
app.include_router(bulk_screening.router)


@app.get("/")
def read_root():
    return {"message": "SmartHire AI Backend running!"}


# ── Socket.io Setup ──────────────────────────────────────────────────────────

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

rooms = {}  # Active interview rooms database in-memory

ai_questions = [
    {"q": "Tell me about yourself and your technical background.", "topic": "HR"},
    {"q": "What is the difference between var, let, and const in JavaScript?", "topic": "JavaScript"},
    {"q": "Explain the concept of closures in JavaScript.", "topic": "JavaScript"},
    {"q": "What is REST API? How does it work?", "topic": "Backend"},
    {"q": "What is the Virtual DOM in React?", "topic": "React"},
    {"q": "Explain the difference between SQL and NoSQL databases.", "topic": "Database"},
    {"q": "What is Git and why do we use version control?", "topic": "Tools"},
    {"q": "Describe a challenging project you have worked on.", "topic": "HR"},
    {"q": "What are your strengths and weaknesses as a developer?", "topic": "HR"},
    {"q": "Where do you see yourself in 5 years?", "topic": "HR"}
]


def evaluate_answer(question: str, answer: str, custom_keywords: list = None) -> dict:
    answer_lower = answer.lower()
    score = 0
    feedback = ""

    keywords = custom_keywords
    if not keywords or not len(keywords):
        keyword_map = {
            "var, let, and const": ["scope", "hoisting", "block", "function", "reassign", "const"],
            "closures": ["function", "scope", "variable", "inner", "outer", "access"],
            "rest api": ["http", "endpoint", "get", "post", "request", "response", "json"],
            "virtual dom": ["virtual", "real", "diff", "update", "render", "performance"],
            "sql and nosql": ["schema", "flexible", "document", "relational", "scale"],
            "git": ["version", "control", "commit", "branch", "merge", "track"]
        }

        keywords = ["good", "understand", "use", "work", "experience"]
        for key, kws in keyword_map.items():
            if key in question.lower():
                keywords = kws
                break

    matched = [kw for kw in keywords if kw.lower() in answer_lower]
    score = min(10, round((len(matched) / len(keywords)) * 10) + 3) if keywords else 5

    if len(answer) < 20:
        score = 2
        feedback = "Answer too short. Please elaborate more."
    elif score >= 8:
        feedback = "Excellent answer! Very well explained."
    elif score >= 5:
        feedback = f"Good attempt! Try to also mention: {', '.join(keywords[:2])}"
    else:
        feedback = f"Needs improvement. Key concepts: {', '.join(keywords[:3])}"

    return {"score": score, "feedback": feedback}


@sio.event
async def connect(sid, environ):
    print("User connected:", sid)


@sio.event
async def disconnect(sid):
    print("User disconnected:", sid)
    # Remove participant from rooms
    for room_id, room in list(rooms.items()):
        room["participants"] = [p for p in room["participants"] if p["id"] != sid]
        if not room["participants"]:
            del rooms[room_id]


@sio.event
async def create_room(sid, data):
    room_id = data.get("roomId")
    user_name = data.get("userName")
    user_id = data.get("userId")
    mode = data.get("mode")
    custom_questions = data.get("customQuestions")
    role = data.get("role")

    questions = custom_questions if (custom_questions and len(custom_questions) > 0) else (ai_questions.copy() if mode == "ai" else [])

    rooms[room_id] = {
        "id": room_id,
        "mode": mode,
        "participants": [],
        "questions": questions,
        "currentQuestion": 0,
        "scores": [],
        "status": "waiting",
        "chat": []
    }
    await sio.enter_room(sid, room_id)

    creator_role = role if role else ("admin" if mode == "admin" else "student")
    rooms[room_id]["participants"].append({
        "id": sid,
        "name": user_name,
        "userId": user_id,
        "role": creator_role
    })

    await sio.emit("room_created", {"roomId": room_id, "mode": mode}, to=sid)
    print(f"Room created: {room_id} by {user_name} with role {creator_role}")

    if mode == "ai":
        if creator_role == "admin":
            rooms[room_id]["status"] = "waiting"
        else:
            rooms[room_id]["status"] = "active"
            
            async def send_first():
                first_q = rooms[room_id]["questions"][0]
                # In customQuestions questions might have keys like q or question
                q_text = first_q.get("q") or first_q.get("question", "")
                await sio.emit("new_question", {
                    "question": q_text,
                    "topic": first_q.get("topic", ""),
                    "questionNumber": 1,
                    "totalQuestions": len(rooms[room_id]["questions"])
                }, to=sid)

            import asyncio
            asyncio.create_task(asyncio.sleep(1.5))
            await send_first()


@sio.event
async def join_room(sid, data):
    room_id = data.get("roomId")
    user_name = data.get("userName")
    user_id = data.get("userId")
    role = data.get("role", "student")
    custom_questions = data.get("customQuestions")

    if room_id not in rooms:
        await sio.emit("error", {"message": "Room not found!"}, to=sid)
        return

    if custom_questions and len(custom_questions) > 0:
        rooms[room_id]["questions"] = custom_questions

    await sio.enter_room(sid, room_id)
    rooms[room_id]["participants"].append({
        "id": sid,
        "name": user_name,
        "userId": user_id,
        "role": role
    })

    await sio.emit("user_joined", {
        "userName": user_name,
        "participants": rooms[room_id]["participants"],
        "message": f"{user_name} joined the interview room"
    }, to=room_id)

    if rooms[room_id]["mode"] == "ai" and rooms[room_id]["status"] == "waiting":
        rooms[room_id]["status"] = "active"
        
        async def send_first_join():
            first_q = rooms[room_id]["questions"][0]
            q_text = first_q.get("q") or first_q.get("question", "")
            await sio.emit("new_question", {
                "question": q_text,
                "topic": first_q.get("topic", ""),
                "questionNumber": 1,
                "totalQuestions": len(rooms[room_id]["questions"])
            }, to=room_id)

        import asyncio
        asyncio.create_task(asyncio.sleep(1.5))
        await send_first_join()

    await sio.emit("room_joined", {
        "roomId": room_id,
        "mode": rooms[room_id]["mode"],
        "participants": rooms[room_id]["participants"]
    }, to=sid)


@sio.event
async def submit_answer(sid, data):
    room_id = data.get("roomId")
    answer = data.get("answer")
    question_index = int(data.get("questionIndex", 0))

    room = rooms.get(room_id)
    if not room:
        return

    question = room["questions"][question_index]
    if not question:
        return

    q_text = question.get("q") or question.get("question", "")
    q_topic = question.get("topic", "")
    q_keywords = question.get("keywords", [])

    evaluation = evaluate_answer(q_text, answer, q_keywords)
    score = evaluation["score"]
    feedback = evaluation["feedback"]

    room["scores"].append({
        "question": q_text,
        "topic": q_topic,
        "answer": answer,
        "score": score,
        "feedback": feedback
    })

    await sio.emit("answer_feedback", {
        "score": score,
        "feedback": feedback,
        "questionIndex": question_index,
        "question": q_text
    }, to=room_id)

    next_index = question_index + 1
    if next_index < len(room["questions"]) and room["mode"] == "ai":
        async def send_next():
            room["currentQuestion"] = next_index
            next_q = room["questions"][next_index]
            nq_text = next_q.get("q") or next_q.get("question", "")
            await sio.emit("new_question", {
                "question": nq_text,
                "topic": next_q.get("topic", ""),
                "questionNumber": next_index + 1,
                "totalQuestions": len(room["questions"])
            }, to=room_id)

        import asyncio
        asyncio.create_task(asyncio.sleep(2.0))
        await send_next()
    elif next_index >= len(room["questions"]):
        total_score = round(sum(s["score"] for s in room["scores"]) / len(room["scores"])) if room["scores"] else 0

        await sio.emit("interview_complete", {
            "totalScore": total_score,
            "results": room["scores"],
            "message": "Interview completed!"
        }, to=room_id)

        # Save to database (fire-and-forget)
        student = next((p for p in room["participants"] if p["role"] == "student"), None)
        student_user_id = student["userId"] if student else None

        if student_user_id:
            from database import SessionLocal
            from models.interview import Interview as DbInterview
            from models.hr_interview_report import HRInterviewReport as DbHRReport
            from models.user import User as DbUser
            from services.notification_service import notify as db_notify
            from services.email_service import send_hr_interview_report

            db = SessionLocal()
            try:
                # Save live interview
                db_interview = DbInterview(
                    user_id=student_user_id,
                    topic="AI Live" if room["mode"] == "ai" else "Admin Live",
                    questions=[
                        {
                            "question": s["question"],
                            "userAnswer": s["answer"],
                            "score": s["score"],
                            "feedback": s["feedback"]
                        }
                        for s in room["scores"]
                    ],
                    total_score=total_score,
                    total_questions=len(room["questions"]),
                    completed_at=datetime.utcnow()
                )
                db.add(db_interview)
                db.commit()

                # Save HR Report
                rec_text = "Strong candidate. Recommended for next round." if total_score >= 7 else "Average performance. Further assessment recommended." if total_score >= 4 else "Needs improvement before proceeding."
                db_hr = DbHRReport(
                    user_id=student_user_id,
                    interview_id=room_id,
                    interview_type="HR",
                    questions=[s["question"] for s in room["scores"]],
                    answers=[s["answer"] for s in room["scores"]],
                    ai_feedback=[s["feedback"] for s in room["scores"] if s["feedback"]],
                    strengths=[],
                    weaknesses=[],
                    communication_score=total_score,
                    confidence_score=total_score,
                    professionalism_score=total_score,
                    overall_score=total_score,
                    recommendation=rec_text,
                    duration=0,
                    created_by_ai=True
                )
                db.add(db_hr)
                db.commit()

                # Notification
                async def run_hr_report_email():
                    user = db.query(DbUser).filter(DbUser.id == student_user_id).first()
                    if user and user.email:
                        send_hr_interview_report(user.email, user.name, {
                            "overallScore": total_score,
                            "communicationScore": total_score,
                            "confidenceScore": total_score,
                            "professionalismScore": total_score,
                            "recommendation": rec_text
                        })

                db_notify(
                    db,
                    student_user_id,
                    "hr_interview",
                    "HR Interview Completed",
                    f"Your live HR interview is complete. Overall score: {total_score}/10.",
                    run_hr_report_email
                )
            except Exception as e:
                print("Failed to save live interview socket result:", e)
            finally:
                db.close()

        room["status"] = "completed"


@sio.event
async def admin_send_question(sid, data):
    room_id = data.get("roomId")
    question = data.get("question")
    topic = data.get("topic")

    room = rooms.get(room_id)
    if not room:
        return

    room["questions"].append({"q": question, "topic": topic})
    room["currentQuestion"] = len(room["questions"]) - 1

    await sio.emit("new_question", {
        "question": question,
        "topic": topic,
        "questionNumber": len(room["questions"]),
        "totalQuestions": len(room["questions"]),
        "fromAdmin": True
    }, to=room_id)


@sio.event
async def send_message(sid, data):
    room_id = data.get("roomId")
    message = data.get("message")
    user_name = data.get("userName")
    role = data.get("role")

    room = rooms.get(room_id)
    if not room:
        return

    from datetime import datetime
    chat_msg = {
        "id": round(datetime.utcnow().timestamp() * 1000),
        "userName": user_name,
        "role": role,
        "message": message,
        "time": datetime.now().strftime("%I:%M:%S %p")
    }

    room["chat"].append(chat_msg)
    await sio.emit("new_message", chat_msg, to=room_id)


@sio.event
async def start_interview(sid, data):
    room_id = data.get("roomId")
    if room_id in rooms:
        rooms[room_id]["status"] = "active"
    await sio.emit("interview_started", to=room_id)


@sio.event
async def end_interview(sid, data):
    room_id = data.get("roomId")
    room = rooms.get(room_id)
    if not room:
        return

    total_score = round(sum(s["score"] for s in room["scores"]) / len(room["scores"])) if room["scores"] else 0

    await sio.emit("interview_complete", {
        "totalScore": total_score,
        "results": room["scores"],
        "message": "Interview ended by admin"
    }, to=room_id)

    # Save to database if scores exist
    if len(room["scores"]) > 0:
        student = next((p for p in room["participants"] if p["role"] == "student"), None)
        student_user_id = student["userId"] if student else None

        if student_user_id:
            from database import SessionLocal
            from models.interview import Interview as DbInterview
            from models.hr_interview_report import HRInterviewReport as DbHRReport
            from models.user import User as DbUser
            from services.notification_service import notify as db_notify
            from services.email_service import send_hr_interview_report

            db = SessionLocal()
            try:
                db_interview = DbInterview(
                    user_id=student_user_id,
                    topic="AI Live" if room["mode"] == "ai" else "Admin Live",
                    questions=[
                        {
                            "question": s["question"],
                            "userAnswer": s["answer"],
                            "score": s["score"],
                            "feedback": s["feedback"]
                        }
                        for s in room["scores"]
                    ],
                    total_score=total_score,
                    total_questions=len(room["questions"]),
                    completed_at=datetime.utcnow()
                )
                db.add(db_interview)
                db.commit()

                rec_text = "Strong candidate. Recommended for next round." if total_score >= 7 else "Average performance. Further assessment recommended." if total_score >= 4 else "Needs improvement before proceeding."
                db_hr = DbHRReport(
                    user_id=student_user_id,
                    interview_id=room_id,
                    interview_type="HR",
                    questions=[s["question"] for s in room["scores"]],
                    answers=[s["answer"] for s in room["scores"]],
                    ai_feedback=[s["feedback"] for s in room["scores"] if s["feedback"]],
                    strengths=[],
                    weaknesses=[],
                    communication_score=total_score,
                    confidence_score=total_score,
                    professionalism_score=total_score,
                    overall_score=total_score,
                    recommendation=rec_text,
                    duration=0,
                    created_by_ai=True
                )
                db.add(db_hr)
                db.commit()

                async def run_hr_report_email_end():
                    user = db.query(DbUser).filter(DbUser.id == student_user_id).first()
                    if user and user.email:
                        send_hr_interview_report(user.email, user.name, {
                            "overallScore": total_score,
                            "communicationScore": total_score,
                            "confidenceScore": total_score,
                            "professionalismScore": total_score,
                            "recommendation": rec_text
                        })

                db_notify(
                    db,
                    student_user_id,
                    "hr_interview",
                    "HR Interview Ended",
                    f"Your live HR interview has ended. Overall score: {total_score}/10.",
                    run_hr_report_email_end
                )
            except Exception as e:
                print("Failed to save ended interview:", e)
            finally:
                db.close()

    room["status"] = "completed"


@sio.event
async def candidate_disqualified(sid, data):
    room_id = data.get("roomId")
    if room_id:
        await sio.emit("candidate_disqualified", data, to=room_id, skip_sid=sid)


# ── WebRTC Signaling ──

@sio.event
async def webrtc_offer(sid, data):
    to_sid = data.get("to")
    offer = data.get("offer")
    await sio.emit("webrtc_offer", {"offer": offer, "from": sid}, to=to_sid)


@sio.event
async def webrtc_answer(sid, data):
    to_sid = data.get("to")
    answer = data.get("answer")
    await sio.emit("webrtc_answer", {"answer": answer, "from": sid}, to=to_sid)


@sio.event
async def webrtc_ice_candidate(sid, data):
    to_sid = data.get("to")
    candidate = data.get("candidate")
    await sio.emit("webrtc_ice_candidate", {"candidate": candidate, "from": sid}, to=to_sid)


@sio.event
async def webrtc_ready(sid, data):
    room_id = data.get("roomId")
    await sio.emit("webrtc_peer_ready", {"from": sid}, to=room_id)
