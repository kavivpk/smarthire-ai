# Requirements Document

## Introduction

This document specifies the requirements for the SmartHire AI Interview Module Overhaul (Phases 1–5). The overhaul restructures the Live Interview page into two clear top-level modes (AI Interview and Manual Interview), introduces a shared proctoring layer with fullscreen enforcement, tab-switch detection, face-presence monitoring, and a 3-strike disqualification system, sequences the AI Interview into a single combined Aptitude → Coding → Technical Q&A session, adds enhancements to the Manual Interview room, and fixes a back-navigation gap in the Resume Analyzer.

Phase 0 (removal of Placement Prediction and Career Roadmap from navigation) is already complete.

---

## Glossary

- **AI Interview**: The fully-automated self-serve interview mode in which a candidate completes Aptitude, Coding, and Technical Q&A sections back-to-back without a human interviewer.
- **Manual Interview**: The real-time room-based interview mode in which a human HR/interviewer conducts a live session with a candidate over WebRTC video and Socket.io.
- **ProctoringGuard**: The React wrapper component (`ProctoringGuard.jsx`) that shows pre-test instructions, checks camera/mic permissions, enters fullscreen, monitors violations, and wraps the test content.
- **useProctoring**: The React hook (`useProctoring.js`) that manages camera/mic streams, fullscreen state, tab-switch/blur detection, face-presence checking (via face-api.js), and violation counting.
- **Violation**: Any of the following events occurring during an active proctored session: tab switch, window blur, fullscreen exit, or face absent from camera frame for 10+ continuous seconds.
- **Strike System**: A 3-strike counter shared across all Violation types within a single test session; the 3rd Violation triggers auto-disqualification.
- **InterviewSession**: A new Mongoose model that records the combined result of one AI Interview run, including per-section scores, violation count, and disqualification flag.
- **Candidate**: A user taking an interview (student role).
- **Interviewer**: An HR or recruiter user conducting a Manual Interview (admin role).
- **ATS Score**: The Applicant Tracking System score computed by the Resume Analyzer service.
- **Sequential Flow**: The Aptitude → Coding → Technical Q&A ordering enforced by the AI Interview mode.

---

## Requirements

### Requirement 1 — AI Interview Sequential Combined Flow

**User Story:** As a candidate, I want to complete Aptitude, Coding, and Technical Q&A in one continuous proctored session, so that my full technical readiness is assessed in a single sitting.

#### Acceptance Criteria

1. WHEN a candidate selects "AI Interview" on the Live Interview setup screen, THE LiveInterview component SHALL render a single "Start AI Interview" entry point instead of the three separate sub-mode buttons (Aptitude / Coding / Q&A).
2. WHEN the AI Interview session starts, THE ProctoringGuard SHALL display the pre-test instructions screen before any section begins.
3. WHEN the candidate completes the Aptitude section, THE LiveInterview component SHALL automatically advance to the Coding section without returning to the setup screen.
4. WHEN the candidate completes the Coding section, THE LiveInterview component SHALL automatically advance to the Technical Q&A section without returning to the setup screen.
5. WHEN the candidate completes the Technical Q&A section, THE LiveInterview component SHALL display a combined results screen showing per-section score breakdown and an overall score.
6. THE LiveInterview component SHALL maintain a single `aiSessionStage` state variable (`aptitude` | `coding` | `qa` | `complete`) to track position within the Sequential Flow.
7. THE LiveInterview component SHALL display a section progress indicator (e.g., step 1/3, 2/3, 3/3) visible throughout the AI Interview.

---

### Requirement 2 — ProctoringGuard Integration

**User Story:** As a platform administrator, I want all proctored test sessions wrapped with the ProctoringGuard component, so that violation monitoring is applied consistently across AI Interview and Manual Interview.

#### Acceptance Criteria

1. WHEN the candidate starts an AI Interview session, THE ProctoringGuard SHALL be rendered as the outermost wrapper around all three AI Interview sections.
2. WHEN the candidate joins or starts a Manual Interview session as the student/candidate role, THE ProctoringGuard SHALL be rendered around the interview room content.
3. THE ProctoringGuard SHALL pass `testTitle` as "AI Interview" when wrapping the AI Interview flow and "Manual Interview" when wrapping the Manual Interview flow.
4. WHILE the ProctoringGuard phase is `instructions`, THE LiveInterview component SHALL NOT render any test content (aptitude questions, code editor, Q&A input).
5. WHEN `onSessionStart` fires from ProctoringGuard, THE LiveInterview component SHALL begin the first section of the AI Interview or the Manual Interview room accordingly.
6. WHEN `onDisqualified` fires from ProctoringGuard, THE LiveInterview component SHALL immediately stop the active section, persist any partial answers, and transition to a `disqualified` stage.

---

### Requirement 3 — AI Interview Combined Session Tracking and Scoring

**User Story:** As a platform administrator, I want all three AI Interview section results plus proctoring data saved as one record, so that recruiters can review a candidate's full assessment in a single document.

#### Acceptance Criteria

1. THE LiveInterview component SHALL maintain a shared `sessionViolations` counter in React state that is incremented by the ProctoringGuard's `onDisqualified`/violation callback and is NOT reset between sections.
2. WHEN the Aptitude section completes, THE LiveInterview component SHALL store the aptitude result (`{ correct, total, totalScore, categoryScores }`) in component state and advance to the Coding section.
3. WHEN the Coding section completes, THE LiveInterview component SHALL store the coding result (`{ solved, total, avgScore, results }`) in component state and advance to the Technical Q&A section.
4. WHEN the Technical Q&A section completes, THE LiveInterview component SHALL store the technical result (`{ overallScore, totalScore }`) in component state and compute the combined overall score as `aptitude.correct/aptitude.total × 30 + coding.avgScore/10 × 40 + technical.overallScore/10 × 20` (normalised to a score out of 90).
5. WHEN all three sections are complete OR the candidate is disqualified, THE backend `POST /interview/session/save` endpoint SHALL be called with the full session payload.
6. THE backend SHALL save an `InterviewSession` document containing: `userId`, `aptitudeResult`, `codingResult`, `technicalResult`, `overallScore`, `violations`, `disqualified`, and `completedAt`.
7. WHEN the InterviewSession is saved, THE backend SHALL call `sendCombinedAIInterviewResult()` with the candidate's email, name, and session data to send the combined email report.
8. IF the candidate is disqualified during the session, THEN THE email SHALL include a disqualification notice with the violation count and whatever partial section scores were recorded at the point of disqualification.

---

### Requirement 4 — Manual Interview Enhancements

**User Story:** As a candidate in a Manual Interview, I want proctoring, voice recognition, and face-presence monitoring applied to my session, so that the interview experience is secure and my answer options are flexible.

#### Acceptance Criteria

1. WHEN a candidate in the Manual Interview room is in the `interview` stage, THE ProctoringGuard SHALL be active and monitoring for violations.
2. WHEN the candidate submits an answer via voice recognition, THE LiveInterview component SHALL transcribe speech in real time using the Web Speech API (`SpeechRecognition`) and append the transcript to the answer textarea, exactly as the existing voice-recognition implementation already does.
3. WHILE the Manual Interview is active, THE useProctoring hook SHALL run face-presence detection using face-api.js at the same 15-second check interval used in the AI Interview.
4. WHEN the candidate starts a Manual Interview session, THE ProctoringGuard SHALL enforce fullscreen and offer the optional screen-share button.
5. WHEN the candidate accrues 3 violations in the Manual Interview session, THE ProctoringGuard SHALL trigger disqualification and THE LiveInterview component SHALL emit a `candidate_disqualified` event via the existing Socket.io connection to the room, including the `roomId` and `violations` count.
6. WHEN the Interviewer's socket receives `candidate_disqualified`, THE interviewer-side UI SHALL display a visible alert panel indicating the candidate was disqualified and the number of violations recorded.

---

### Requirement 5 — Resume Analyzer Back Navigation

**User Story:** As a candidate, I want a "Back to Dashboard" button on the Resume Analyzer results screen, so that I can navigate back into the app without using the browser back button.

#### Acceptance Criteria

1. WHEN the Resume Analyzer results view is rendered (i.e., `result` state is non-null), THE ResumeAnalyzer component SHALL display a "← Back to Dashboard" button at the top of the results view.
2. WHEN the candidate clicks "← Back to Dashboard", THE ResumeAnalyzer component SHALL navigate to `/dashboard` using the React Router `useNavigate` hook.
3. THE "← Back to Dashboard" button SHALL be visually consistent with the existing exit-style link pattern used elsewhere in the app (small, muted text link style as seen in the aptitude test's "← Exit and Back to Setup" link).

---

### Requirement 6 — Pre-Test Instructions and Permissions Screen

**User Story:** As a candidate, I want a clear pre-test instructions screen that verifies my camera and microphone are working before any test starts, so that I am not surprised by proctoring requirements mid-test.

#### Acceptance Criteria

1. WHEN ProctoringGuard renders in `instructions` phase, THE ProctoringGuard SHALL display the test rules, pre-flight checklist, and action buttons before any test content is shown.
2. WHEN the candidate clicks "Allow Camera & Microphone", THE ProctoringGuard SHALL call `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` and update the checklist state.
3. WHEN camera and microphone permissions are granted, THE ProctoringGuard SHALL enable the "Start Test" button.
4. IF the candidate denies camera or microphone permission, THEN THE ProctoringGuard SHALL display an error message explaining that camera and microphone access is required and the "Start Test" button SHALL remain disabled.
5. WHEN the candidate clicks "Start Test", THE ProctoringGuard SHALL call `document.documentElement.requestFullscreen()` and transition the phase to `active`.
6. WHILE the ProctoringGuard phase is `active`, THE ProctoringGuard SHALL display a camera thumbnail preview in the bottom-right corner showing the candidate's live video feed.
7. WHEN the optional screen-share button is clicked, THE ProctoringGuard SHALL call `navigator.mediaDevices.getDisplayMedia({ video: true })` and update the screen-share status indicator; IF the user cancels the browser prompt, no violation SHALL be recorded.

---

### Requirement 7 — Violation Detection and Strike System

**User Story:** As a platform administrator, I want every violation during a proctored test to be tracked, warned, and escalated to disqualification on the third occurrence, so that candidates cannot game the system.

#### Acceptance Criteria

1. WHEN the candidate switches tabs or the document visibility becomes hidden during an active proctored session, THE useProctoring hook SHALL increment the violation counter by 1.
2. WHEN the candidate's window loses focus (`window blur`) during an active proctored session, THE useProctoring hook SHALL increment the violation counter by 1.
3. WHEN the candidate exits fullscreen during an active proctored session, THE useProctoring hook SHALL increment the violation counter by 1 and attempt to re-enter fullscreen automatically after 300ms.
4. WHEN no face is detected by face-api.js for 10 or more continuous seconds, THE useProctoring hook SHALL increment the violation counter by 1.
5. WHEN the violation counter is less than 3 and a new violation is recorded, THE ProctoringGuard SHALL display a warning modal with the current violation count (e.g., "Warning 2/3").
6. WHEN the violation counter reaches 3, THE useProctoring hook SHALL set `isDisqualified` to true and invoke the `onDisqualified` callback with the violation count and reason.
7. THE violation counter SHALL NOT be reset between sections of the AI Interview Sequential Flow.
8. WHEN a new test attempt begins (i.e., ProctoringGuard mounts fresh), THE violation counter SHALL be initialised to 0.
