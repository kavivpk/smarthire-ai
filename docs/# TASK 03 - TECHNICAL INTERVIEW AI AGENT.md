# TASK 03 - TECHNICAL INTERVIEW AI AGENT

## Objective

Implement the Technical Interview AI Agent database persistence.

This phase is ONLY for storing technical interview reports.

Do NOT implement HR Interview, Resume Analysis, Dashboard Analytics, or Placement Recommendation in this task.

---

# Existing Project

Project Name:
SmartHire AI

Tech Stack:
- React + Vite
- Node.js
- Express
- MongoDB (Mongoose)
- Gemini AI

Completed:

✅ Phase 1
- CodingReport model

✅ Phase 2
- Coding report persistence

Now implement ONLY Phase 3.

---

# Goal

Whenever a Technical Interview finishes successfully,
store the complete interview report in MongoDB.

---

# Requirements

Create a new model.

backend/models/InterviewReport.js

Use existing project conventions.

Enable timestamps.

Collection name:

InterviewReports

---

# Model Fields

Store the following:

userId

interviewId

interviewType

questions

answers

aiFeedback

strengths

weaknesses

technicalScore

problemSolvingScore

communicationScore

overallScore

recommendation

duration

createdByAI

createdAt

updatedAt

---

# Field Types

userId

ObjectId

ref User

Required

----------------------------

interviewId

String

Required

----------------------------

interviewType

String

Default:

Technical

----------------------------

questions

Array

Default []

----------------------------

answers

Array

Default []

----------------------------

aiFeedback

Array

Default []

----------------------------

strengths

Array

Default []

----------------------------

weaknesses

Array

Default []

----------------------------

technicalScore

Number

Default 0

----------------------------

problemSolvingScore

Number

Default 0

----------------------------

communicationScore

Number

Default 0

----------------------------

overallScore

Number

Default 0

----------------------------

recommendation

String

Default ""

----------------------------

duration

Number

Default 0

----------------------------

createdByAI

Boolean

Default true

---

# Save Logic

Find the controller that completes the Technical Interview.

After interview evaluation finishes successfully,

Create

new InterviewReport()

Populate all available fields.

Save asynchronously.

If database save fails,

log the error,

DO NOT break the existing interview flow.

The interview response should still return successfully.

---

# Important Rules

DO NOT

Change frontend

DO NOT

Change request payload

DO NOT

Change response format

DO NOT

Break existing APIs

DO NOT

Rename existing routes

DO NOT

Create duplicate controllers

DO NOT

Refactor unrelated code

Only add the minimum required code.

---

# Coding Style

Match existing project style.

Use async/await.

Use try/catch.

Use mongoose Schema.

Export exactly like other models.

---

# After Implementation

Show:

1.
Every modified file.

2.
Every new file.

3.
Explain save flow.

4.
Explain where InterviewReport is saved.

5.
Confirm that

existing Technical Interview still works.

6.
STOP.

Wait for approval before continuing.

Do not start HR Interview Agent.

Do not start Resume Analyzer.

Do not start Dashboard Analytics.

Do not start any next phase.

End of Task.