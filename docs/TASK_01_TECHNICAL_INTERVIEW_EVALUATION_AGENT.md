# TASK 01 - Technical Interview Evaluation Agent

## Objective

Implement an Enterprise Technical Interview Evaluation Agent on top of the existing SmartHire AI project.

IMPORTANT:

This is an EXISTING production-ready project.

DO NOT rewrite the project.

DO NOT regenerate pages.

DO NOT replace APIs.

DO NOT modify working modules.

Only extend the existing implementation.

---

# Existing Features (Already Working)

Authentication

Dashboard

Resume Upload

Resume Parser

Resume Based Question Generation

Topic Based Interview

Placement Prediction

Career Roadmap

Email System

Interview History

MongoDB

Node Backend

FastAPI AI Service

React Frontend

All of these MUST remain working.

---

# Goal

Current Flow

Resume

↓

Generate Questions

↓

User Answers

↓

Next Question


New Flow

Resume

↓

Generate Questions

↓

User Answers

↓

AI Evaluation

↓

Store Result

↓

Dashboard

↓

Email Report

---

# Existing Flow Must Stay

Keep

Question Generation

Question Navigation

Progress Bar

Resume Upload

Interview UI

History

Authentication

Nothing should break.

---

# AI Evaluation

For every answer evaluate

Technical Accuracy

Communication

Grammar

Confidence

Keyword Match

Expected Answer Match

Overall Score

Feedback

Strength

Weakness

Recommendation

---

# Example Response

Question

Explain React Hooks.

Candidate Answer

Hooks allow state management inside functional components...

AI Response

Technical Accuracy

9.2/10

Communication

8.5/10

Grammar

9/10

Confidence

8/10

Keyword Match

90%

Overall

8.7/10

Feedback

Good explanation.

Mention useEffect lifecycle usage.

---

# AI Service

Create ONLY NEW modules.

Never modify existing AI endpoints.

Create

/agents/interview/

interview_agent.py

communication.py

grammar.py

keyword_match.py

confidence.py

technical.py

feedback.py

report.py

---

# Backend

Create NEW route

POST

/api/interview/evaluate

Input

Question

Answer

Resume

Interview Id

User Id

Output

Technical Score

Communication Score

Grammar Score

Confidence Score

Keyword Score

Overall

Feedback

Recommendation

---

# Database

Create new collection

technical_interview_reports

Fields

_id

userId

interviewId

question

answer

technicalScore

communicationScore

grammarScore

confidenceScore

keywordScore

overallScore

feedback

strength

weakness

recommendation

createdAt

Do NOT modify existing collections.

---

# Frontend

Current interview page

After clicking

Submit Answer

Immediately show

AI Evaluation Card

Technical

Communication

Grammar

Confidence

Keyword Match

Overall

Feedback

Recommendation

Allow user to continue to next question.

Do not redesign the page.

Only insert new evaluation section.

---

# End of Interview

Generate Interview Summary

Overall Score

Average Technical

Average Communication

Average Grammar

Average Confidence

Strongest Skill

Weakest Skill

Recommendations

---

# Dashboard

Add new widget

Recent Technical Interview

Overall Score

Last Interview Date

Average Score

Total Interviews

---

# Email

Reuse existing email service.

DO NOT create another mail service.

Send

Technical Interview Report

Include

Overall

Technical

Communication

Grammar

Confidence

Feedback

Recommendation

---

# API Rules

Never remove existing endpoints.

Never rename existing endpoints.

Never modify response formats used by frontend.

Only add new APIs.

---

# Frontend Rules

Never replace components.

Never delete components.

Never change routing.

Never change authentication.

Only extend UI.

---

# Backend Rules

Never change authentication logic.

Never modify resume parser.

Never modify question generator.

Never modify prediction system.

Never modify roadmap generator.

Only extend interview module.

---

# Database Rules

Never modify existing schemas.

Create only new collection.

---

# Code Quality

Use reusable services.

Use modular architecture.

No duplicated code.

Proper error handling.

Logging.

Validation.

---

# Performance

Evaluation should happen asynchronously.

Avoid blocking UI.

Response time should be under 2 seconds.

---

# Deliverables

Working Interview Evaluation Agent

Backend API

Mongo Collection

Dashboard Widget

Email Integration

Interview Summary

No regression in existing features.

---

# Acceptance Criteria

✅ Existing project works without errors.

✅ Existing interview works.

✅ AI evaluates every answer.

✅ Result stored in MongoDB.

✅ Dashboard updated.

✅ Email sent.

✅ No existing feature broken.

This task is complete only if every existing module continues working without regression.