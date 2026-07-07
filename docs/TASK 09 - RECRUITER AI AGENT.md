# TASK 09 - RECRUITER AI AGENT

## Objective

Create an AI Recruiter Decision Agent.

This agent should assist recruiters in making hiring decisions using all previously generated AI reports.

------------------------------------------------------------

IMPORTANT

Do NOT replace any existing module.

Do NOT redesign frontend.

Do NOT break APIs.

Do NOT duplicate AI logic.

Reuse all existing reports.

------------------------------------------------------------

Input

Resume Report

Coding Report

Technical Interview Report

HR Interview Report

Placement Recommendation

------------------------------------------------------------

AI Decision

Generate

Overall Candidate Score

Hire Recommendation

Risk Level

Technical Readiness

Communication Readiness

Culture Fit

Top Strengths

Top Weaknesses

Interview Summary

Final Recruiter Recommendation

------------------------------------------------------------

Recommendation Types

Hire

Strong Hire

Maybe

Need Another Interview

Reject

------------------------------------------------------------

Create

backend/models/RecruiterRecommendation.js

------------------------------------------------------------

Fields

userId

candidateId

resumeReportId

codingReportId

technicalInterviewId

hrInterviewId

placementRecommendationId

overallScore

recommendation

riskLevel

technicalReadiness

communicationReadiness

cultureFit

strengths

weaknesses

summary

createdByAI

timestamps

------------------------------------------------------------

Backend

Reuse existing reports.

Do NOT regenerate reports.

Read all reports.

Generate one recruiter recommendation.

Store in MongoDB.

------------------------------------------------------------

Frontend

Reuse Admin Dashboard.

Create only one new page if necessary.

Avoid redesign.

------------------------------------------------------------

Rules

No breaking changes.

No duplicate APIs.

No duplicate reports.

Reuse gemini AI.

------------------------------------------------------------

Deliverables

Show modified files.

Explain recruiter decision flow.

Explain recommendation flow.

Explain MongoDB changes.

Wait for approval.