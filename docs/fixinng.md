# SmartHire AI — AI Interview Fixes + Coding/Technical Completion

## Context

The AI Interview instructions screen, proctoring, and Aptitude section were
partially built from a previous spec. Testing revealed several bugs and one
major structural gap: **Coding and Technical sections were never actually
built inside the AI Interview flow** — only Aptitude exists right now.

Work through the phases below **in order**, confirming after each one.

---

## Phase A — Fix the "Before You Begin" instructions screen layout

**Bug:** The instructions screen currently renders small/cramped at the top
of the page instead of filling the full viewport.

### Fix
- The instructions screen container is likely missing a full-height wrapper.
  Ensure the outer container uses `min-h-screen` (not just default height),
  and that it isn't nested inside a parent with a constrained/scrollable
  height that's cutting it off.
- Center the content vertically and horizontally within the full viewport:
  `min-h-screen flex flex-col items-center justify-center` (or similar,
  matching the app's existing Tailwind patterns).
- **Highlight key warning phrases** using bold + the app's existing warning
  accent color (whatever red/orange is already used elsewhere for
  warnings — check `Resume Analyzer`'s missing-skills tag color for
  consistency), specifically these phrases:
  - **"requires camera and microphone access"**
  - **"Do not switch tabs, minimize the window, or exit fullscreen"**
  - **"3 times will automatically disqualify you"**
  - **"Stay visible in your camera frame"**
- Keep the rest of the text at normal weight so the highlighted phrases
  stand out clearly against the paragraph text.

---

## Phase B — Fix the section timer bug (critical)

**Bug:** When a section (e.g. Analytical) is submitted early with time
remaining, that remaining time is **not carried over** into the Total Time
countdown — the next section still starts with the same full total time as
before, meaning finishing early gives no benefit and the total time display
is not actually tracking real elapsed/remaining time correctly.

### Root cause to check first
Look at how the timer state is structured. This bug pattern usually means
there are **two independent timers** — a per-section timer (resets to a
fixed value like 15:00 for each new section) and a separate "Total Time"
countdown that is not actually deriving from the same clock. Find the timer
logic (likely in the aptitude/section test component) and confirm whether
`totalTime` is its own independent `setInterval`/countdown instead of being
calculated from a single shared start time.

### Fix
- There should be **one single source of truth**: an overall test start
  timestamp (e.g. `testStartTime = Date.now()` set once when the whole AI
  Interview begins) and a fixed total duration (e.g. 75 minutes for the
  whole test).
- Total Time remaining = `totalDuration - (Date.now() - testStartTime)`,
  recalculated every second via one interval — this is what should drive
  the "TOTAL TIME" display, and it must **never reset** when moving between
  sections.
- The per-section timer (e.g. "SECTION TIME 14:55") can still show a
  soft per-section suggested time (for pacing guidance), but it should be
  informational only and must **not** be the thing driving how much total
  time is left. If a section is submitted early or late, only the single
  total timer's natural countdown reflects that — nothing needs to be
  manually "carried over" if there's only one real clock to begin with.
- If total time reaches 0, auto-submit whatever has been answered so far
  across all sections (same behavior as a manual final submit).

---

## Phase C — Fix proctoring violations not triggering (critical)

**Bug:** Tab switching, exiting fullscreen, and moving away from the
camera during the test do **not** show any warning — the 3-strike system
from the earlier spec does not appear to be functioning at all.

### Debug steps (do these in order, report findings before fixing blindly)
1. Confirm the event listeners actually exist and are attached at the
   right time: `document.addEventListener('visibilitychange', ...)`,
   `document.addEventListener('fullscreenchange', ...)`, and the face
   detection interval — check they are registered when the test screen
   mounts (e.g. in a `useEffect` with `[]` or a proper dependency array),
   not accidentally attached to a component that unmounts before the test
   starts.
2. Add a temporary `console.log` inside each event handler to confirm
   whether the events fire at all when you manually switch tabs / exit
   fullscreen during a test — this tells us if it's a detection problem or
   a UI/display problem (i.e. the violation is detected but the warning
   modal isn't rendering).
3. Check whether the violation counter state update and the warning modal
   are correctly wired — a common bug here is updating a `ref` instead of
   `state` (which won't trigger a re-render), or the modal component
   checking the wrong condition to decide whether to show itself.
4. Once you've identified whether it's a detection issue or a
   display issue, fix accordingly. Test each of the three triggers
   individually (tab switch, fullscreen exit, camera/face-away) and confirm
   each independently shows the warning and increments the same shared
   counter.
5. Confirm the 3rd violation actually ends the test and marks it
   disqualified — this whole chain was likely never working since the
   underlying detection wasn't confirmed working in the first build.

---

## Phase D — Restructure AI Interview into 3 real sections: Aptitude, Coding, Technical

**Current state:** AI Interview only contains the Aptitude test (with its
5 sub-categories: Analytical, Logical, Verbal, Quantitative, Technical —
all MCQ). Coding and Technical (as full sections in their own right) were
never actually built into this flow, even though the earlier spec called
for it.

### What to build
Restructure the AI Interview into a **sequential 3-stage flow**:

**Stage 1 — Aptitude** (keep as is, just fix the timer/proctoring bugs
above): sub-categories Analytical, Logical/Reasoning, Verbal, Quantitative
(and whatever 5th category currently exists) — MCQ format, as it currently
works structurally.

**Stage 2 — Coding**: reuse the existing coding round UI already built
elsewhere in the project (`CodingAssessment.jsx` / the coding editor with
problem statement + multi-language editor seen earlier in "Choose Interview
Type → Coding"). Wire it into this sequential flow so it runs as Stage 2
immediately after Aptitude submits, under the same proctoring session
(same violation counter, same camera/fullscreen monitoring — do not reset
the violation count between stages). Give it a fixed number of problems
(e.g. 3 problems) each scored out of a set max (e.g. 10 points each = 30
total), using whatever code-evaluation logic already exists for the coding
round.

**Stage 3 — Technical**: reuse the existing Tech Q&A flow already built
elsewhere (resume-based technical questions, AI evaluates typed answers
against expected keywords — same scoring pattern as Mock Interview). Wire
it in as Stage 3, same proctoring session continuing.

### Flow behavior
- Candidate goes through all 3 stages back-to-back with **no way to skip
  the proctoring session between them** — camera stays on, fullscreen
  stays active, violation count persists across all 3 stages.
- Progress indicator should show which stage (1/3, 2/3, 3/3) the candidate
  is on.
- Only after Stage 3 is submitted (or the test is force-ended by
  disqualification or timeout) does the final combined report get
  generated and emailed.

---

## Phase E — Fix and complete the final combined email report

**Bug:** The email currently sent still uses the **old, standalone
aptitude-only email template** (seen showing 0% — a separate known bug from
before, and only covering Aptitude, not the full 3-stage test). This needs
to be replaced with **one combined report email**, sent immediately once
all 3 stages are complete (or the test ends via disqualification/timeout).

### Required email format
Send to the candidate's registered/logged-in email address, structured like
this example (adapt the exact category names to whatever the Aptitude
section's real sub-categories are):

```
AI Interview Results

APTITUDE
  Analytical:     17 / 20
  Verbal:         15 / 20
  Quantitative:   17 / 20
  Reasoning:      13 / 20
  Aptitude Total: 62 / 80

CODING
  Problem 1: 7 / 10
  Problem 2: 8 / 10
  Problem 3: 7 / 10
  Coding Total: 22 / 30

TECHNICAL
  Technical Total: 30 / 40

OVERALL
  Grand Total: 114 / 150 (76%)

Status: [Completed / Disqualified — reason: tab switching / camera violation]
```

### Implementation
- Locate wherever the old standalone aptitude email is triggered (the
  route/controller that sends "Your Aptitude Assessment Results") and
  **replace it** with a new function that only fires after all 3 stages
  are done, pulling scores from all 3 stages' saved results.
- Make sure this new combined email actually gets called at the right
  point in the flow (end of Stage 3 submission, or on disqualification/
  timeout as a forced end) — test this explicitly, since the previous
  version's email either wasn't firing correctly or was firing with stale/
  wrong data (0% shown despite real answers).
- If disqualified partway through, still send the email with whatever
  stages were completed and clearly mark the incomplete ones as "Not
  attempted" along with the disqualification reason.

---

## Acceptance checklist

- [ ] Instructions screen fills the full page, centered, with key warning phrases bolded/highlighted
- [ ] Total Time is a single continuous countdown that never resets between sections/stages
- [ ] Tab switching triggers a visible warning and increments the violation counter
- [ ] Exiting fullscreen triggers a visible warning and increments the violation counter
- [ ] Camera/face-away for 10+ seconds triggers a visible warning and increments the violation counter
- [ ] 3rd violation ends the test immediately and marks it disqualified
- [ ] AI Interview runs Aptitude → Coding → Technical as one continuous proctored session
- [ ] Coding stage uses the existing coding editor/evaluation logic, scored per problem
- [ ] Technical stage uses the existing Q&A evaluation logic
- [ ] One combined email is sent immediately at the end, with the exact category/sub-category breakdown format shown above
- [ ] The old standalone aptitude-only email is fully replaced/removed, not sent alongside the new one
- [ ] Disqualified sessions still send an email with partial results + reason