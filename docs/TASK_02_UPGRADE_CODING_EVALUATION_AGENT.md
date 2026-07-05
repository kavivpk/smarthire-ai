# TASK 02 - Upgrade Existing Coding Evaluation Module

## Objective

Upgrade the EXISTING Coding Assessment module into an Enterprise AI Coding Evaluation Agent.

IMPORTANT

This project is already functional.

DO NOT rewrite the coding module.

DO NOT replace the current code editor.

DO NOT replace existing APIs.

DO NOT redesign the Coding page.

Only extend the current implementation.

---

# Existing Features

The following already exist.

- Coding Editor
- Programming Questions
- Code Execution
- Submit Button
- Backend APIs
- Authentication
- Dashboard
- MongoDB
- Email Service
- GROQ Integration (if already configured)

These features MUST continue working.

---

# Goal

Current Flow

Coding Question

↓

Write Code

↓

Submit


New Flow

Coding Question

↓

Write Code

↓

Run Code

↓

Submit

↓

AI Evaluation

↓

Store Report

↓

Dashboard

↓

Email Result

---

# AI Evaluation

The AI must evaluate

Correctness

Time Complexity

Space Complexity

Code Quality

Readability

Naming Convention

Logic

Optimization

Edge Cases

Best Practices

Overall Score

Strengths

Weaknesses

Recommendations

---

# Example Output

Correctness

95%

Time Complexity

8.5/10

Space Complexity

8/10

Optimization

9/10

Readability

9/10

Overall

89%

Feedback

Good solution.

Use HashMap to reduce complexity.

---

# Dashboard

Add

Latest Coding Assessment

Average Coding Score

Total Coding Tests

Last Submission

Coding Trend

Do NOT redesign dashboard.

Only extend.

---

# Email

Reuse the existing Email Service.

Do NOT create a new mail service.

Automatically send Coding Assessment Report after evaluation.

Include

Overall Score

Time Complexity

Space Complexity

Optimization

Readability

Feedback

Recommendations

---

# Database

Create ONLY a new collection if required.

Example

coding_evaluation_reports

Never modify existing collections.

---

# Backend

Reuse existing coding APIs.

Only extend them.

Never rename endpoints.

Never remove routes.

---

# Frontend

Keep existing Coding UI.

After clicking Submit

Display

AI Evaluation Panel

Overall Score

Complexity

Optimization

Feedback

Recommendations

Allow user to continue normally.

---

# AI Layer

Reuse existing GROQ/OpenAI integration if available.

Avoid duplicate AI clients.

Create reusable evaluation services.

---

# Rules

DO NOT

- Rewrite Coding Module
- Replace Editor
- Remove Existing APIs
- Break Dashboard
- Break Authentication

ONLY

Extend

Improve

Integrate

---

# Deliverables

Working AI Coding Evaluation

Dashboard Integration

Email Integration

Database Storage

No Regression

---

# Acceptance Criteria

Existing Coding Module still works.

AI evaluates every submission.

Coding Report stored.

Dashboard updated.

Email sent.

No existing feature is broken.