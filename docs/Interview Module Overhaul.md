# SmartHire AI — Interview Module Overhaul + Proctoring Spec

## Objective

This is a large restructuring task. Work through it in the **phases listed
below, in order**, and stop after each phase for confirmation before moving
to the next one. Do not attempt all phases in a single pass.

---

## Phase 0 — Remove Placement Prediction & Career Roadmap

**Reasoning:** This platform is positioned as a hiring/recruitment AI tool
used by companies to evaluate candidates. Placement Prediction and Career
Roadmap are personal self-improvement tools for students, not something a
company evaluating a candidate needs — so these are being removed from
scope entirely.

### Steps
1. In `frontend/src/App.jsx`: remove the routes and imports for
   `PlacementPrediction` and `CareerRoadmap` (`/prediction` and
   `/career-roadmap` routes).
2. In `frontend/src/components/Header.jsx`: remove `Prediction` and
   `Roadmap` entries from the `navLinks` array.
3. In `frontend/src/pages/Dashboard.jsx`: remove the "Placement Prediction"
   and "Career Roadmap" feature cards from the features grid.
4. Do **not** delete the actual page files (`PlacementPrediction.jsx`,
   `CareerRoadmap.jsx`) or their backend routes/controllers yet — just
   disconnect them from navigation and routing, in case they're needed
   again later. Confirm this with me before permanently deleting any files.
5. Confirm the app still builds and runs with no broken imports after removal.

**Stop here and confirm before Phase 1.**

---

## Phase 1 — Restructure the student-facing feature set

After Phase 0, the student Dashboard should show only three feature cards:
- **Resume Analyzer**
- **Mock Interview** (existing topic-based / resume-based practice — keep as is)
- **Live Interview** — this becomes the main hub, restructured as follows.

### Live Interview page structure (`LiveInterview.jsx`)
Two top-level modes, selected first (this selection screen may already
partly exist — adapt it, don't duplicate):

1. **AI Interview** — fully automated, no human interviewer. Contains
   three sequential sections a candidate completes in one sitting:
   - Aptitude (MCQ)
   - Coding
   - Technical (Q&A)
2. **Manual Interview** — real-time with a human interviewer (the existing
   HR Live Interview / room-based flow), enhanced per Phase 4 below.

**Stop here and confirm this structure matches your understanding before
Phase 2.**

---

## Phase 2 — Shared proctoring layer (used by both AI Interview and Manual Interview)

Build this as a **reusable component/hook**, e.g. `useProctoring.js` +
a `<ProctoringGuard>` wrapper component, so both AI Interview and Manual
Interview use the exact same logic instead of two separate implementations.

### 2.1 Pre-test instructions screen (shown before ANY test/interview starts)
A full-screen modal/page shown before the candidate can begin, with:
- Clear instructions: "This test requires camera and microphone access.
  Do not switch tabs or exit fullscreen during the test — doing so 3 times
  will automatically disqualify you."
- A checklist the candidate must acknowledge: camera detected ✅, microphone
  detected ✅, fullscreen mode ready ✅.
- A **"Start Test"** button that only becomes enabled once camera + mic
  permissions are granted (test this with `navigator.mediaDevices.getUserMedia`).
- Clicking "Start Test" requests fullscreen (`element.requestFullscreen()`)
  and begins the session.

### 2.2 Camera & microphone
- Request `getUserMedia({ video: true, audio: true })` on the instructions
  screen, keep the stream active for the duration of the test.
- Show a small live camera preview thumbnail in a corner of the test screen
  (candidate should be able to see they're being recorded/monitored) —
  reuse the video preview UI pattern already built for the Manual Interview
  video call.
- If the candidate denies camera/mic permission, block test start and show
  a clear message explaining it's required.

### 2.3 Screen share (optional but offered)
- Provide a "Share your screen" button using
  `navigator.mediaDevices.getDisplayMedia()` before/during the test.
- **Important limitation to be aware of:** browsers cannot force a user to
  share their screen — this is opt-in only, same as any video call app
  (Zoom, Google Meet). Treat this as a monitoring aid, not a hard
  enforcement mechanism. Note this limitation clearly in the UI copy.

### 2.4 Fullscreen enforcement
- On test start, call `requestFullscreen()`.
- Listen for `fullscreenchange` — if the candidate exits fullscreen during
  the test, count it as one violation (see 2.5) and prompt them to
  re-enter fullscreen to continue.

### 2.5 Tab-switch / focus-loss detection with 3-strike disqualification
- Listen for the `visibilitychange` event and `window.blur` as a fallback.
- On each detected tab switch / window blur / fullscreen exit during an
  active test:
  1. Increment a violation counter (shared across all violation types —
     tab switch, fullscreen exit, or closing the camera stream all count
     toward the same 3-strike limit).
  2. Show a clear on-screen warning modal: **"Warning {n}/3: Switching
     tabs or leaving fullscreen is not allowed during this test."**
  3. On the 3rd violation, immediately end the test, mark the result as
     `disqualified: true`, submit whatever answers were completed so far
     (don't lose partial progress), and show a "You have been
     disqualified due to repeated tab switching" screen.
- Persist the violation count in component state tied to the current test
  session (reset to 0 for each new test attempt).

### 2.6 Face presence check (scoped realistically — read this carefully)
Full identity verification (confirming the person on camera IS the
registered candidate) is a significant ML undertaking and is **out of
scope for this build**. What to build instead for v1:
- Use a lightweight client-side face detection library (`face-api.js` is
  a good fit — works in-browser, no backend ML service needed) to
  periodically check (e.g. every 15-20 seconds) that **a face is present**
  in the camera frame.
- If no face is detected for a sustained period (e.g. 10+ seconds
  continuously), treat it as a violation using the same 3-strike system
  from 2.5 (e.g. "Warning: please stay visible in the camera frame").
- Do **not** attempt facial identity matching/verification in this phase —
  flag it clearly to me as a possible future enhancement if wanted later,
  but do not build it now.

**Stop here and confirm the proctoring layer works standalone (test it on
a simple dummy page) before wiring it into the actual interview flows.**

---

## Phase 3 — AI Interview: Aptitude, Coding, Technical sections

Wrap all three sections with the `<ProctoringGuard>` from Phase 2 (pre-test
instructions → camera/mic check → fullscreen → proceed to test → monitor
violations throughout).

### 3.1 Aptitude section
- This section already exists in some form (MCQ-based, sections like
  Analytical/Logical/Verbal/Quantitative/Technical seen in earlier
  screenshots) — **there is a known scoring bug where results always
  show 0%** (confirmed earlier: emailed results showed `0/15` on every
  section). Fix this first: locate the aptitude submission/scoring route
  (`submitAptitude` in `interviewController.js`, referenced earlier) and
  debug why correct answers aren't being counted — check that the
  frontend sends the selected answer in the exact format
  (option index vs option text) the backend comparison expects.
- Once scoring is fixed, keep the existing question/answer UI and timer
  structure as is.

### 3.2 Coding section
- Reuse the existing coding round UI (`CodingAssessment.jsx` / the coding
  round already seen inside Live Interview Studio) — multi-language code
  editor, problem statement, run/submit.
- Ensure it is wrapped in the same proctoring flow and contributes its
  own score to the final report.

### 3.3 Technical section
- Reuse the existing Tech Q&A resume-based question flow already built
  inside Live Interview Studio (AI evaluates typed answers against
  expected keywords, same pattern as the existing Mock Interview scoring).
- Wrap in the same proctoring flow.

### 3.4 Combined flow & final report
- Candidate goes through all three sections back-to-back in one sitting
  (Aptitude → Coding → Technical), with the proctoring session active
  throughout (violation count carries across all three sections, not
  reset per section).
- At the end, compute a **per-section score breakdown**, e.g.:
  ```
  Aptitude: 12/20
  Coding: 30/40
  Technical: 20/30
  Overall: 62/90 (69%)
  ```
- Save this combined result to the database (extend or create an
  `InterviewSession` record linking all three section results + violation
  count + disqualified flag).

### 3.5 Immediate email report
- Reuse the existing email-sending logic already used for the aptitude
  result email (seen earlier — "Your Aptitude Assessment Results" email
  template) and extend it to include all three sections' breakdown, sent
  immediately upon completion to the **candidate's registered/logged-in
  email address**.
- If the candidate was disqualified, clearly state that in the email along
  with whatever partial scores were recorded.

**Stop here and confirm all three sections work correctly end-to-end
(including proctoring and the email report) before Phase 4.**

---

## Phase 4 — Manual Interview enhancements

Keep the existing room creation / Room ID / WhatsApp share / join-by-code
flow exactly as it is now — **do not change that part.**

Add on top of the existing video call interview room:

### 4.1 Multiple answer input modes for the candidate
During the live interview, alongside the existing typed-answer flow, add:
- **Typing** (already exists — keep as is)
- **Voice recognition** — use the Web Speech API (`SpeechRecognition`,
  already used elsewhere in this app for voice input per earlier project
  notes) to let the candidate speak their answer, transcribed to text in
  real time, editable before sending.
- **Face recognition** — same scoped meaning as Phase 2.6: presence-check
  only (confirms candidate is visible on camera), not identity
  verification. This runs continuously during the manual interview the
  same way it does in the AI interview.

### 4.2 Full screen + screen share
- Apply the same fullscreen enforcement and optional screen-share button
  from Phase 2.3/2.4 to the Manual Interview room, for both participants
  if practical, at minimum for the candidate/student side.

### 4.3 Tab-switch monitoring + 3-strike disqualification
- Apply the exact same `<ProctoringGuard>` violation-counting system from
  Phase 2.5 to the Manual Interview flow. If the candidate is
  disqualified mid-interview, notify the interviewer/HR side in real time
  via the existing Socket.io connection (e.g. an `candidate_disqualified`
  event) so they see it immediately in their panel.

**Stop here and confirm the Manual Interview flow works with all
enhancements before Phase 5.**

---

## Phase 5 — Small fix: Resume Analyzer back navigation

On the Resume Analyzer results page (after a resume has been analyzed and
the ATS score / matched-skills / suggestions are shown), there is currently
no way to navigate back into the app without using the browser's back
button. Add a clear **"← Back to Dashboard"** button/link at the top of the
results view that navigates to `/dashboard`, matching the visual style
already used elsewhere in the app (e.g. similar to the "← Exit and Back to
Setup" link style seen in the aptitude test screen).

---

## Explicit out-of-scope items (do not build these)

- Facial identity verification/matching (only presence-detection, per 2.6)
- Server-side screen recording storage/playback
- Forcing screen share (not technically possible in browsers — opt-in only)
- Any change to Resume Analyzer's or Mock Interview's core scoring logic
  beyond the aptitude bug fix explicitly called out in 3.1

---

## Acceptance checklist (check at the very end, after all phases)

- [ ] Placement Prediction and Career Roadmap are fully removed from nav/routes/dashboard
- [ ] Dashboard shows exactly 3 features: Resume Analyzer, Mock Interview, Live Interview
- [ ] Live Interview has two clear modes: AI Interview and Manual Interview
- [ ] AI Interview runs Aptitude → Coding → Technical in one sitting with combined scoring
- [ ] Aptitude scoring bug is fixed (no more 0% results)
- [ ] Pre-test instructions screen appears before any test, requiring camera/mic confirmation
- [ ] Fullscreen is enforced, with re-entry prompt if exited
- [ ] Tab switch / fullscreen exit / no-face-detected violations share one 3-strike counter
- [ ] 3rd violation auto-disqualifies and submits partial progress
- [ ] Email with per-section score breakdown is sent immediately after AI Interview completion
- [ ] Manual Interview supports typing, voice recognition, and face-presence detection as answer/monitoring modes
- [ ] Manual Interview has fullscreen, screen-share option, and the same 3-strike proctoring
- [ ] Resume Analyzer results page has a working "Back to Dashboard" button