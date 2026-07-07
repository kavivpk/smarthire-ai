# Implementation Plan: Interview Module Overhaul (Phases 1–5)

## Overview

Implement all five phases of the SmartHire AI Interview Module Overhaul. The work is primarily frontend state-management changes in `LiveInterview.jsx`, minimal backend additions (`InterviewSession` model + one endpoint + one socket event), and small fixes to `ResumeAnalyzer.jsx`. The existing `ProctoringGuard.jsx` and `useProctoring.js` are already complete and require no changes.

---

## Tasks

- [x] 1. Add `InterviewSession` model and `POST /interview/session/save` endpoint
  - [x] 1.1 Create `backend/models/InterviewSession.js` with the schema defined in the design (fields: `userId`, `aptitudeResult`, `codingResult`, `technicalResult`, `overallScore`, `violations`, `disqualified`, `completedAt`)
    - _Requirements: 3.6_
  - [x] 1.2 Add `saveInterviewSession` controller function in `backend/controllers/interviewController.js`
    - Validate `req.user.id` is present
    - `InterviewSession.create(...)` with the request body fields
    - After save, fire-and-forget `sendCombinedAIInterviewResult` using the saved user's email
    - Export the new function alongside existing exports
    - _Requirements: 3.5, 3.7, 3.8_
  - [x] 1.3 Register `POST /session/save` route in `backend/routes/interviewRoutes.js` protected by `authMiddleware`
    - _Requirements: 3.5_
  - [ ]* 1.4 Write unit tests for the `saveInterviewSession` handler
    - Test saves with complete payload, partial payload (disqualified mid-session), and missing userId
    - _Requirements: 3.6, 3.8_
  - [ ]* 1.5 Write property test for InterviewSession field completeness
    - **Property 8: InterviewSession document contains all required fields**
    - **Validates: Requirements 3.6**

- [ ] 2. Refactor `LiveInterview.jsx` — AI Interview Sequential Flow
  - [-] 2.1 Add new state variables: `aiSessionStage` (`'aptitude'|'coding'|'qa'|'complete'`), `sessionViolations`, `sessionDisqualified`, `sessionStarted`, `codingResult`, `techResult`, `combinedScore`
    - Remove `aiSubMode` state (no longer used)
    - _Requirements: 1.6, 3.1_
  - [-] 2.2 Remove the AI sub-mode picker grid (Aptitude / Coding / Q&A buttons) from the setup screen's `mainMode === 'ai'` block; replace it with a single "Start AI Interview" button that sets `stage = 'ai_interview'` and `aiSessionStage = 'aptitude'`
    - _Requirements: 1.1_
  - [-] 2.3 Add a new top-level render branch: `if (stage === 'ai_interview')` that wraps content in `<ProctoringGuard testTitle="AI Interview" onSessionStart onDisqualified>` and conditionally renders Aptitude/Coding/QA/Results based on `aiSessionStage`
    - Children are only rendered when `sessionStarted === true`
    - _Requirements: 1.2, 2.1, 2.4, 2.5_
  - [-] 2.4 Add `AIInterviewProgress` inline progress indicator (the three-step indicator described in the design) at the top of the AI Interview active content area, showing which of the three sections is current/completed
    - _Requirements: 1.7_
  - [ ]* 2.5 Write property test for AI Interview section transitions
    - **Property 6: AI Interview section transitions are one-way and in order**
    - **Validates: Requirements 1.3, 1.4, 1.5, 3.2, 3.3**

- [ ] 3. Implement section handoff callbacks
  - [-] 3.1 Write `onAptitudeComplete(result)` handler: stores `aptResult` in state, sets `aiSessionStage = 'coding'`
    - Call this from the existing `submitAptitude` success path instead of `setStage('result')`
    - _Requirements: 1.3, 3.2_
  - [-] 3.2 Write `onCodingComplete(results)` handler: computes `{ solved, total, avgScore }`, stores `codingResult`, sets `aiSessionStage = 'qa'`
    - Call this from `nextCodingProblem` and `handleAutoSubmitCode` paths when the last problem is reached, instead of `setStage('result')`
    - _Requirements: 1.4, 3.3_
  - [-] 3.3 Wire the Technical Q&A socket `interview_complete` event handler: store `techResult`, call `computeCombinedScore`, set `aiSessionStage = 'complete'`, call `saveAndEmailSession()`
    - _Requirements: 1.5, 3.4_
  - [-] 3.4 Implement `saveAndEmailSession()` helper function inside `LiveInterview.jsx` that calls `POST /interview/session/save` via `API.post(...)` with the current session state; handle network errors without crashing the UI
    - _Requirements: 3.5, 3.7_
  - [ ]* 3.5 Write property test for the combined score formula
    - **Property 7: Combined score formula is consistent**
    - **Validates: Requirements 3.4**
    - Extract `computeCombinedScore` as a pure helper function (not inside the component) to make it independently testable

- [~] 4. Checkpoint — Verify AI Interview sequential flow end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm: setup → ProctoringGuard instructions → active → Aptitude → Coding → Q&A → combined results screen → `saveAndEmailSession` fires → results screen is shown

- [ ] 5. Add Combined Results Screen
  - [-] 5.1 Add the combined results render block inside `stage === 'ai_interview'` when `aiSessionStage === 'complete'`
    - Show per-section breakdown: Aptitude score, Coding avg score, Technical score, overall score with `<ScoreRing>` (reuse existing component)
    - If `sessionDisqualified`, show a disqualification banner
    - "Return to Setup" button calls `resetAll()`
    - _Requirements: 1.5, 3.4_
  - [-] 5.2 Extend `resetAll()` to clear all new AI session state (`aiSessionStage`, `sessionViolations`, `sessionDisqualified`, `sessionStarted`, `aptResult`, `codingResult`, `techResult`, `combinedScore`)
    - _Requirements: 1.6_

- [ ] 6. Wire ProctoringGuard to Manual Interview (candidate role)
  - [~] 6.1 In the `stage === 'waiting'` render block, wrap the candidate-side waiting room content with `<ProctoringGuard testTitle="Manual Interview" onSessionStart onDisqualified={handleManualDisqualified}>` only when `role === 'student'`
    - _Requirements: 2.2, 2.3_
  - [~] 6.2 In the `stage === 'interview'` render block, wrap the candidate-side interview content with the same ProctoringGuard (keep interviewer/admin side unwrapped)
    - _Requirements: 2.2, 4.1, 4.4_
  - [~] 6.3 Write `handleManualDisqualified({ violations, reason })` handler: sets `sessionDisqualified = true`, emits `candidate_disqualified` socket event with `{ roomId, violations, reason }`
    - _Requirements: 4.5_
  - [ ]* 6.4 Write property test for candidate_disqualified socket event emission
    - **Property 10: candidate_disqualified socket event emitted on Manual Interview disqualification**
    - **Validates: Requirements 4.5**

- [ ] 7. Add `candidate_disqualified` socket event relay on server
  - [~] 7.1 In `backend/server.js`, add socket listener `socket.on('candidate_disqualified', (data) => { socket.to(data.roomId).emit('candidate_disqualified', data); })`
    - _Requirements: 4.5_
  - [~] 7.2 In `LiveInterview.jsx` inside `connectSocket()`, add `newSocket.on('candidate_disqualified', ({ violations, reason }) => { setCandidateDisqualified({ violations, reason }); })`
    - Add `candidateDisqualified` state variable (initially `null`)
    - _Requirements: 4.6_
  - [~] 7.3 In the Interviewer's admin panel (the question-sending panel in `stage === 'interview'` when `isAdmin === true`), render an alert card when `candidateDisqualified` is non-null showing "⚠ Candidate was disqualified — {violations} violations" in red
    - _Requirements: 4.6_

- [~] 8. Checkpoint — Verify Manual Interview proctoring integration
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm: Manual Interview candidate gets ProctoringGuard instructions → active → violations increment → disqualification emits socket event → Interviewer sees alert

- [ ] 9. Add "Back to Dashboard" to ResumeAnalyzer
  - [~] 9.1 In `frontend/src/pages/ResumeAnalyzer.jsx`, import `useNavigate` from `react-router-dom` and add `const navigate = useNavigate()` inside the component
    - _Requirements: 5.2_
  - [~] 9.2 At the top of the `{result && (...)}` block, add the "← Back to Dashboard" button (small muted text style matching the aptitude test's "← Exit and Back to Setup" link) that calls `navigate('/dashboard')`
    - _Requirements: 5.1, 5.2_
  - [ ]* 9.3 Write property test for Back to Dashboard button presence
    - **Property 9: Back to Dashboard renders iff result is non-null**
    - **Validates: Requirements 5.1**

- [~] 10. Final Checkpoint — Full acceptance checklist verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify against the acceptance checklist in `docs/Interview Module Overhaul.md`:
    - [~] Dashboard shows 3 features (Phase 0 already done)
    - [~] AI Interview runs Aptitude → Coding → Technical sequentially
    - [~] Pre-test instructions + ProctoringGuard active for AI Interview
    - [~] Pre-test instructions + ProctoringGuard active for Manual Interview (candidate only)
    - [~] Violations shared across all three AI Interview sections
    - [~] 3rd violation auto-disqualifies and saves partial progress
    - [~] Combined email report sent after AI Interview completion
    - [~] Manual Interview candidate_disqualified socket event fires on 3rd violation
    - [~] Interviewer sees disqualification alert
    - [~] Resume Analyzer "← Back to Dashboard" button present and working

---

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- `ProctoringGuard.jsx` and `useProctoring.js` require **no changes** — they are already feature-complete
- The aptitude scoring bug (0% results) is already fixed with the `Number()` coercion in `submitAptitude` in `interviewController.js`
- `sendCombinedAIInterviewResult` is already implemented in `backend/utils/emailService.js` — just needs to be called from the new endpoint
- All new state in `LiveInterview.jsx` must be cleared in the extended `resetAll()` to avoid stale state on retry
- The `computeCombinedScore` function should be extracted outside the component body as a pure function to enable independent unit testing (Property 7)
- Socket.io relay of `candidate_disqualified` must be added to `backend/server.js` — without this relay, the interviewer will never receive the event
