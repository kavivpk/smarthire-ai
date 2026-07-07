# Design Document — SmartHire AI Interview Module Overhaul (Phases 1–5)

## Overview

This design restructures `LiveInterview.jsx` into a two-mode hub (AI Interview / Manual Interview), wires the already-built `ProctoringGuard.jsx` and `useProctoring.js` into both modes, sequences the AI Interview into a three-section flow, adds a new `InterviewSession` backend model, and adds back-navigation to `ResumeAnalyzer.jsx`.

The existing proctoring components are already feature-complete. Most work is plumbing and state-management changes in `LiveInterview.jsx` plus adding the `InterviewSession` model and a save endpoint.

---

## Architecture

```
LiveInterview.jsx (state machine)
│
├── [setup stage] ─── Mode picker: AI Interview | Manual Interview
│
├── [AI Interview path]
│   └── <ProctoringGuard testTitle="AI Interview" onSessionStart onDisqualified>
│       ├── [aiSessionStage = aptitude]  ── Aptitude section (existing render)
│       ├── [aiSessionStage = coding]    ── Coding section (existing render)
│       ├── [aiSessionStage = qa]        ── Technical Q&A section (existing render)
│       └── [aiSessionStage = complete]  ── Combined results screen
│
└── [Manual Interview path]
    └── <ProctoringGuard testTitle="Manual Interview" onSessionStart onDisqualified>
        └── Waiting room + Interview room (existing socket/video UI)
```

Backend additions:
```
POST /interview/session/save
  → InterviewSession.create(...)
  → sendCombinedAIInterviewResult(...)
```

---

## Component Changes

### 1. `LiveInterview.jsx` — State Machine Refactor

**New state variables:**

```javascript
// Session-level
const [aiSessionStage, setAiSessionStage] = useState('aptitude'); // aptitude | coding | qa | complete
const [sessionViolations, setSessionViolations] = useState(0);
const [sessionDisqualified, setSessionDisqualified] = useState(false);
const [sessionStarted, setSessionStarted] = useState(false); // true after ProctoringGuard fires onSessionStart
const [aptResult, setAptResult]     = useState(null); // { correct, total, totalScore, categoryScores }
const [codingResult, setCodingResult] = useState(null); // { solved, total, avgScore, results }
const [techResult, setTechResult]   = useState(null); // { overallScore, totalScore }
const [combinedScore, setCombinedScore] = useState(null); // { score, outOf, percent }
```

**Removed state:**
- `aiSubMode` (no longer a separate top-level picker for AI sub-modes)
- The sub-mode grid (Aptitude / Coding / Q&A buttons) is removed from the setup screen when `mainMode === 'ai'`

**Top-level render logic:**

```javascript
// stage values: 'setup' | 'aptitude' | 'coding' | 'qa_interview' | 'waiting' | 'interview' | 'result'
// new: 'ai_interview' stage drives the combined AI flow
if (stage === 'setup') return <SetupScreen />;

if (stage === 'ai_interview') {
  return (
    <ProctoringGuard
      testTitle="AI Interview"
      onSessionStart={() => setSessionStarted(true)}
      onDisqualified={handleAIDisqualified}
    >
      {sessionStarted && (
        <>
          {aiSessionStage === 'aptitude' && <AptitudeSection />}
          {aiSessionStage === 'coding'   && <CodingSection />}
          {aiSessionStage === 'qa'       && <QASection />}
          {aiSessionStage === 'complete' && <CombinedResultScreen />}
        </>
      )}
    </ProctoringGuard>
  );
}

if (stage === 'waiting' || stage === 'interview') {
  if (mainMode === 'admin') {
    return (
      <ProctoringGuard
        testTitle="Manual Interview"
        onSessionStart={() => setSessionStarted(true)}
        onDisqualified={handleManualDisqualified}
        showCameraThumbnail={role === 'student'}
      >
        {/* existing waiting room and interview room UI */}
      </ProctoringGuard>
    );
  }
  return <>{/* existing admin/interviewer-side UI, no proctoring guard */}</>;
}
```

**ProctoringGuard is only shown to the student/candidate role in Manual Interview.** The Interviewer (admin role) does not get wrapped — they already have camera via WebRTC `VideoCall`.

**Section transition handlers:**

```javascript
// Called when Aptitude submit completes
const onAptitudeComplete = (result) => {
  setAptResult(result);           // store { correct, total, totalScore, categoryScores }
  setAiSessionStage('coding');    // advance
};

// Called when last coding problem is submitted
const onCodingComplete = (results) => {
  const solved = results.filter(r => r.score >= 5).length;
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) / 10
    : 0;
  setCodingResult({ solved, total: results.length, avgScore, results });
  setAiSessionStage('qa');
};

// Called when Q&A socket emits interview_complete
const onQAComplete = (data) => {
  setTechResult({ overallScore: data.totalScore, totalScore: data.totalScore });
  setAiSessionStage('complete');
  saveAndEmailSession({ ...stateSnapshot, techResult: data });
};
```

**Score computation formula:**

```javascript
// Normalised to 90 points total
// Aptitude:  up to 30 pts  (correct / total × 30)
// Coding:    up to 40 pts  (avgScore / 10 × 40)
// Technical: up to 20 pts  (overallScore / 10 × 20)
function computeCombinedScore(apt, cod, tech) {
  const aptPts  = apt  ? Math.round((apt.correct  / apt.total)  * 30) : 0;
  const codPts  = cod  ? Math.round((cod.avgScore / 10)         * 40) : 0;
  const techPts = tech ? Math.round((tech.overallScore / 10)    * 20) : 0;
  const score   = aptPts + codPts + techPts;
  const outOf   = 90;
  const percent = Math.round((score / outOf) * 100);
  return { score, outOf, percent, aptPts, codPts, techPts };
}
```

**Disqualification handlers:**

```javascript
const handleAIDisqualified = ({ violations, reason }) => {
  setSessionViolations(violations);
  setSessionDisqualified(true);
  // Save whatever partial data we have
  saveAndEmailSession({ disqualified: true, violations });
};

const handleManualDisqualified = ({ violations, reason }) => {
  setSessionViolations(violations);
  setSessionDisqualified(true);
  if (socket) {
    socket.emit('candidate_disqualified', { roomId, violations, reason });
  }
};
```

**Socket event on Interviewer side:**

```javascript
// Add inside connectSocket():
newSocket.on('candidate_disqualified', ({ violations, reason }) => {
  // Set state that triggers the interviewer's alert panel
  setCandidateDisqualified({ violations, reason });
});
```

---

### 2. `ProctoringGuard.jsx` — No Changes Required

The existing `ProctoringGuard.jsx` is already feature-complete per the codebase review. It already:
- Shows instructions screen with checklist
- Requests camera/mic
- Offers optional screen share
- Enters fullscreen on Start Test
- Shows camera thumbnail during active session
- Shows warning modal for violations
- Shows disqualification screen on 3rd violation
- Exposes `onSessionStart` and `onDisqualified` callbacks

No modifications are needed.

---

### 3. `useProctoring.js` — No Changes Required

The existing `useProctoring.js` is already feature-complete per the codebase review. It already:
- Detects tab switches via `visibilitychange`
- Detects window blur
- Detects fullscreen exits with re-entry attempt
- Detects face absence for 10+ seconds via face-api.js
- Maintains violation counter with 3-strike system
- Exposes `startFaceCheck`, `stopFaceCheck`, `recordViolation`, `dismissWarning`

No modifications are needed.

---

### 4. Section Progress Indicator (New UI Component)

A small inline progress indicator to be added at the top of the ProctoringGuard's active content area when in AI Interview mode:

```jsx
// AIInterviewProgress.jsx (inline helper or small component)
function AIInterviewProgress({ stage }) {
  const steps = [
    { id: 'aptitude', label: 'Aptitude', icon: '🧠' },
    { id: 'coding',   label: 'Coding',   icon: '💻' },
    { id: 'qa',       label: 'Tech Q&A', icon: '🗣️' },
  ];
  const stageOrder = { aptitude: 0, coding: 1, qa: 2, complete: 3 };
  const currentIdx = stageOrder[stage] ?? 0;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 16px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: i < currentIdx ? '#10b981' : i === currentIdx ? '#6366f1' : 'rgba(255,255,255,0.08)',
            color: i <= currentIdx ? '#fff' : '#6b7280',
          }}>
            {s.icon} {s.label}
          </span>
          {i < steps.length - 1 && <span style={{ color: '#374151' }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

### 5. Combined Results Screen (New UI Section in `LiveInterview.jsx`)

Rendered when `stage === 'ai_interview'` and `aiSessionStage === 'complete'`:

```jsx
if (stage === 'ai_interview' && aiSessionStage === 'complete') {
  const combined = computeCombinedScore(aptResult, codingResult, techResult);
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h2>AI Interview Complete</h2>
      <ScoreRing score={combined.percent} />
      <p>{combined.score} / {combined.outOf} ({combined.percent}%)</p>
      {/* Per-section breakdown */}
      <div>Aptitude: {aptResult?.correct}/{aptResult?.total} ({combined.aptPts}/30 pts)</div>
      <div>Coding: {codingResult?.avgScore}/10 avg ({combined.codPts}/40 pts)</div>
      <div>Technical: {techResult?.overallScore}/10 ({combined.techPts}/20 pts)</div>
      {sessionDisqualified && <p>Session ended early due to proctoring violations.</p>}
      <button onClick={resetAll}>Return to Setup</button>
    </div>
  );
}
```

---

### 6. `ResumeAnalyzer.jsx` — Back Navigation

**Change:** Import `useNavigate` from `react-router-dom` and add the button at the top of the results section.

```jsx
import { useNavigate } from 'react-router-dom';

export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  // ... existing code ...

  // Inside the result && ( ... ) block, add at the top:
  {result && (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-all font-medium"
      >
        ← Back to Dashboard
      </button>
      {/* ... existing ATS Score card, skills cards, suggestions ... */}
    </div>
  )}
```

---

## Data Models

### `InterviewSession` (New Mongoose Model)

**File:** `backend/models/InterviewSession.js`

```javascript
const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  aptitudeResult: {
    correct:        { type: Number, default: 0 },
    total:          { type: Number, default: 0 },
    totalScore:     { type: Number, default: 0 },  // percentage 0-100
    categoryScores: { type: Map, of: Object, default: {} },
  },
  codingResult: {
    solved:   { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },  // 0-10
    results:  { type: Array,  default: [] },
  },
  technicalResult: {
    overallScore: { type: Number, default: 0 },  // 0-100
    totalScore:   { type: Number, default: 0 },
  },
  overallScore: {
    score:   { type: Number, default: 0 },
    outOf:   { type: Number, default: 90 },
    percent: { type: Number, default: 0 },
  },
  violations:   { type: Number, default: 0 },
  disqualified: { type: Boolean, default: false },
  completedAt:  { type: Date,   default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
```

---

## Backend Endpoint

### `POST /interview/session/save`

**File:** `backend/controllers/interviewController.js` (add new export)

**Route registration:** `backend/routes/interviewRoutes.js`

**Request body:**
```json
{
  "aptitudeResult":  { "correct": 12, "total": 20, "totalScore": 60, "categoryScores": {} },
  "codingResult":    { "solved": 3, "total": 5, "avgScore": 7.2, "results": [] },
  "technicalResult": { "overallScore": 65, "totalScore": 65 },
  "overallScore":    { "score": 60, "outOf": 90, "percent": 67 },
  "violations":      1,
  "disqualified":    false
}
```

**Response:**
```json
{ "message": "Session saved", "sessionId": "<ObjectId>" }
```

**Handler logic:**

```javascript
const saveInterviewSession = async (req, res) => {
  try {
    const { aptitudeResult, codingResult, technicalResult, overallScore, violations, disqualified } = req.body;
    const session = await InterviewSession.create({
      userId: req.user.id,
      aptitudeResult:  aptitudeResult  || {},
      codingResult:    codingResult    || {},
      technicalResult: technicalResult || {},
      overallScore:    overallScore    || { score: 0, outOf: 90, percent: 0 },
      violations:      violations      || 0,
      disqualified:    disqualified    || false,
      completedAt:     new Date(),
    });

    // Fire-and-forget email
    const user = await User.findById(req.user.id).select('email name');
    if (user && user.email) {
      sendCombinedAIInterviewResult(user.email, user.name, {
        aptitude:     aptitudeResult  || {},
        coding:       codingResult    || {},
        technical:    technicalResult || {},
        overall:      overallScore    || {},
        violations:   violations      || 0,
        disqualified: disqualified    || false,
      }).catch(err => console.error('Email send failed:', err));
    }

    res.json({ message: 'Session saved', sessionId: session._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

---

## API Routes Update

**File:** `backend/routes/interviewRoutes.js`

Add:
```javascript
router.post('/session/save', authMiddleware, saveInterviewSession);
```

---

## Socket Events

### New Event: `candidate_disqualified` (client → server → client)

**Emitted by:** Candidate's `LiveInterview.jsx` `handleManualDisqualified` callback

**Payload:**
```json
{ "roomId": "ROOM-XXXXXX", "violations": 3, "reason": "Switched tabs or minimized the window" }
```

**Received by:** Interviewer's `LiveInterview.jsx` socket handler `newSocket.on('candidate_disqualified', ...)`

**Server relay:** The existing Socket.io server must broadcast this event to all members of the room. Add to `backend/server.js`:

```javascript
socket.on('candidate_disqualified', (data) => {
  socket.to(data.roomId).emit('candidate_disqualified', data);
});
```

---

## Frontend State Flow Diagram

```
setup (mainMode = 'ai')
  └─[Start AI Interview]──► stage = 'ai_interview', aiSessionStage = 'aptitude'
                              └── ProctoringGuard (instructions → active)
                                  └── AptitudeSection
                                      └─[submit]──► aiSessionStage = 'coding'
                                                    └── CodingSection
                                                        └─[last submit]──► aiSessionStage = 'qa'
                                                                           └── QASection
                                                                               └─[complete]──► aiSessionStage = 'complete'
                                                                                               └── CombinedResultScreen
                                                                                                   └─[reset]──► setup

setup (mainMode = 'admin')
  └─[Create/Join Room]──► stage = 'waiting'
                           └── ProctoringGuard (for student role only)
                               └─[interview_started event]──► stage = 'interview'
                                   └── Manual Interview room
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Camera/mic denied at pre-test | Show error message in ProctoringGuard checklist, block Start Test |
| Screen share cancelled by user | No action (not a violation per §6.7) |
| `saveInterviewSession` POST fails | Log error, show user a non-blocking toast that results were saved locally; still show combined results screen |
| `sendCombinedAIInterviewResult` email fails | Fire-and-forget with `.catch` — does not block session save response |
| face-api.js CDN fails to load | face detection silently disabled; no violation counted for face absence |
| Socket disconnects during Manual Interview | Existing error handling unchanged; ProctoringGuard continues monitoring violations in case of reconnect |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do.*

### Property 1: ProctoringGuard starts in instructions phase

For any fresh mount of ProctoringGuard, the initial phase SHALL be `instructions` and no test content (children) SHALL be rendered.

**Validates: Requirements 2.4, 6.1, 7.8**

---

### Property 2: Start Test button enabled iff permissions granted

For any checklist state, the Start Test button SHALL be enabled if and only if both `checklist.camera` and `checklist.mic` are `true`. For any state where either is `false`, the button SHALL remain disabled.

**Validates: Requirements 6.3, 6.4**

---

### Property 3: Screen share cancellation does not increment violations

For any cancellation (rejection) of `getDisplayMedia`, the violation counter SHALL remain unchanged from its value before the cancellation call.

**Validates: Requirements 6.7**

---

### Property 4: Violation counter is monotonically non-decreasing within a session

For any sequence of violation events during a single proctored session, the violation counter after each event SHALL be greater than or equal to its value before the event. The counter SHALL never decrease without a fresh mount.

**Validates: Requirements 3.1, 7.1, 7.2, 7.3, 7.4, 7.7**

---

### Property 5: Disqualification triggers on exactly the 3rd violation

For any active session, when the violation counter reaches 3, `isDisqualified` SHALL become `true` and the `onDisqualified` callback SHALL be invoked exactly once with a non-zero violation count. No further violations SHALL be recorded after disqualification.

**Validates: Requirements 7.6**

---

### Property 6: AI Interview section transitions are one-way and in order

For any AI Interview session, the `aiSessionStage` SHALL progress only in the order `aptitude → coding → qa → complete`. The stage SHALL never regress to a prior value and SHALL never skip a step unless disqualification causes early termination.

**Validates: Requirements 1.3, 1.4, 1.5, 3.2, 3.3**

---

### Property 7: Combined score formula is consistent

For any three valid section result objects (aptitudeResult, codingResult, technicalResult), `computeCombinedScore` SHALL return a deterministic result where `score = aptPts + codPts + techPts`, `outOf = 90`, `percent = Math.round(score / 90 * 100)`, and each part score is within its allocated range (aptPts ∈ [0,30], codPts ∈ [0,40], techPts ∈ [0,20]).

**Validates: Requirements 3.4**

---

### Property 8: InterviewSession document contains all required fields

For any valid save payload, the persisted `InterviewSession` document SHALL contain `userId`, `aptitudeResult`, `codingResult`, `technicalResult`, `overallScore`, `violations`, `disqualified`, and `completedAt`. No required field SHALL be absent or null.

**Validates: Requirements 3.6**

---

### Property 9: Back to Dashboard renders iff result is non-null

For any state of `ResumeAnalyzer` where `result` is non-null, the "← Back to Dashboard" button SHALL be present in the rendered output. For any state where `result` is null, the button SHALL not be present.

**Validates: Requirements 5.1**

---

### Property 10: candidate_disqualified socket event emitted on Manual Interview disqualification

For any Manual Interview session where violations reach 3 and the candidate's role is `student`, a `candidate_disqualified` socket event SHALL be emitted with the correct `roomId` and a `violations` value of 3. The event SHALL not be emitted if the role is `admin` or if violations are fewer than 3.

**Validates: Requirements 4.5**
