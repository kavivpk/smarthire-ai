# 🔍 Core Modules Implementation Deep Dive

This document breaks down the internal engineering logic, algorithms, and implementation details for every major subsystem in **SmartHire AI**.

---

## 1. 🤖 AI Interview Studio (3-Tier Sequential Flow)

The AI Interview Studio mimics a full-fledged campus or corporate placement assessment consisting of 3 progressive rounds.

### Round 1: Adaptive Aptitude Assessment
- **Structure:** 3 sections (Quantitative Aptitude, Logical Reasoning, Verbal Ability) with dynamic timing per section and global countdown timer.
- **Dynamic PDF Ingestion:** Candidates can upload a custom curriculum PDF (`ai-service/routers/aptitude.py`). The service extracts text using `pdfplumber`, prompts Groq to generate 35 tailored MCQs with answer keys, and injects them dynamically into the test runner.
- **Section Locking:** Candidates must confirm section completion before unlocking subsequent sections.

### Round 2: Interactive Code Execution & Evaluation
- **Monaco Editor Integration:** Embedded multi-language editor (Java, Python, C++, JavaScript) with theme synchronization (VS Dark/Light), font scaling, and keyboard shortcuts.
- **Sandboxed LLM Code Evaluation:**
  - Instead of maintaining heavy Docker container clusters for compilation, the system uses Groq's high-speed inference model (`openai/gpt-oss-120b`) prompted as a deterministic code execution engine.
  - Traces code flow against hidden and sample test cases, compares stdout with expected values, computes Time/Space Complexity ($O(N)$, $O(1)$), and returns a structured verdict (`Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error`).
  - Implements **2048 token allocation** and regex JSON extraction to guarantee valid structured responses without truncation.

### Round 3: AI Technical Voice Interview
- **Speech-to-Text & Speech Synthesis:** Uses the browser's native `webkitSpeechRecognition` with continuous listening and speech synthesis for interactive voice questions.
- **Dynamic Questioning:** Questions are dynamically generated from the candidate's uploaded resume skills. Follow-up questions are adaptively generated based on the candidate's verbal responses.

---

## 2. 📹 HR Real-Time WebRTC Live Interview

When human recruiters conduct live interviews:
- **Signaling via Socket.io:**
  - `join_room` $\rightarrow$ registers participants.
  - `offer` / `answer` $\rightarrow$ exchanges Session Description Protocol (SDP) metadata.
  - `ice_candidate` $\rightarrow$ discovers network routing candidates through STUN servers (`stun:stun.l.google.com:19302`).
- **Peer-to-Peer Media Streaming:** Direct low-latency browser-to-browser encrypted video/audio communication.
- **Live Collaborative Code Editor:** Socket.io emits `code_change` and `code_update` events to synchronize editor keystrokes between candidate and recruiter in real-time.
- **Live AI Interviewer Assistant:** Recruiter gets on-the-fly AI questions suggested based on candidate answers.

---

## 3. 🛡️ Anti-Cheat Proctoring Guard Engine

Implemented across [`useProctoring.js`](file:///e:/Project/smarthire-ai/frontend/src/components/useProctoring.js) and [`ProctoringGuard.jsx`](file:///e:/Project/smarthire-ai/frontend/src/components/ProctoringGuard.jsx):

```
                       [ Candidate Screen ]
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
[ Fullscreen Monitor ]   [ Visibility Tracker ]   [ Face Check Loop ]
(document.fullscreenElement)  (visibilitychange event)  (Canvas/TF.js Face Check)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                 [ Violation Counter (0..3) ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ 1..2 Strikes ]                 [ 3rd Strike ]
   (Show Warning Toast / Red Overlay) (Terminate Session & Email Partial Score)
```

1. **Dual-Layer Fullscreen Enforcement:**
   - Layer 1: Hardware browser fullscreen API (`document.documentElement.requestFullscreen()`).
   - Layer 2: CSS `.proctoring-active header { display: none !important; }` class dynamically applied to hide the top navigation bar and prevent candidate distraction.
2. **Tab-Switch & Blur Detection:** Listens to `window.onblur` and `document.addEventListener('visibilitychange')`. Any tab switch triggers an immediate violation warning.
3. **Face Presence Detection:** Continuous frame analysis checks if the candidate leaves the webcam frame.
4. **Disqualification Circuit Breaker:** On the 3rd strike, the session terminates, force-submits all completed answers up to that point, and saves the session marked as `disqualified: true`.

---

## 4. 📄 ATS Resume Analyzer & Skill Gap Engine

Implemented in [`backend/routers/resume.py`](file:///e:/Project/smarthire-ai/backend/routers/resume.py) & [`ats_scoring.py`](file:///e:/Project/smarthire-ai/backend/services/ats_scoring.py):

- **In-Memory Parsing (`io.BytesIO`):** Reads PDF bytes directly from the HTTP payload without writing to disk.
- **Hybrid Scoring Algorithm:**
  1. **Deterministic Rule Engine:** Matches extracted n-grams against an extensive dictionary of 500+ standard tech skills across Frontend, Backend, Cloud, Databases, and DevOps. Computes the base ATS Match %.
  2. **LLM Qualitative Audit:** Evaluates project descriptions, metric quantification (e.g., "Reduced latency by 40%"), formatting cleanliness, and role fit suggestions.

---

## 5. 🔍 AI Fake Skill & Exaggeration Detector

Implemented in [`ai-service/routers/fake_skill.py`](file:///e:/Project/smarthire-ai/ai-service/routers/fake_skill.py):
- **Problem:** Many candidates list advanced technologies (e.g., "Kubernetes", "Kafka", "PyTorch") in their skills list without having used them in any project or work experience.
- **Detection Algorithm:**
  - Extracts the isolated **Skills List** and **Experience / Projects** sections.
  - Uses an LLM agent with structured prompt instructions to cross-reference every listed skill against project narratives.
  - Scores credibility ($0-100\%$) and outputs categorized warnings:
    - 🔴 **High Severity:** Skill listed with zero project evidence or contradictory claims.
    - 🟡 **Medium Severity:** Skill mentioned briefly without context on how it was applied.
    - 🟢 **Verified:** Concrete usage demonstrated with metrics and implementation details.

---

## 6. 📁 Bulk Resume Screening Engine (1,000 Resumes)

Implemented in [`backend/routers/bulk_screening.py`](file:///e:/Project/smarthire-ai/backend/routers/bulk_screening.py) and [`BulkScreening.jsx`](file:///e:/Project/smarthire-ai/frontend/src/pages/BulkScreening.jsx):

- **Folder & Recursive Directory Drag-and-Drop:** Supports native directory selection via `webkitdirectory` and recursive folder tree traversal to ingest 1,000 files in a single drag-and-drop.
- **Parallel Stream Parsing:** Asynchronously reads and scores resumes against custom recruiter requirements in milliseconds.
- **Client-Side Export:** Ranked candidate table with dynamic "Shortlisted Only" toggle filter and one-click CSV report generation.

---

## 7. 📬 Automated Notification & Email Delivery Pipeline

Implemented in [`email_service.py`](file:///e:/Project/smarthire-ai/backend/services/email_service.py) & [`notification_service.py`](file:///e:/Project/smarthire-ai/backend/services/notification_service.py):

- **Asynchronous Task Spawning (`asyncio` / BackgroundTasks):** Email dispatch never blocks the HTTP response cycle.
- **Responsive HTML Templates:** Delivers comprehensive visual report cards containing:
  - Grand Total & Percentile Score.
  - Section-by-section breakdown (Aptitude categories, Coding problem scores, Technical voice metrics).
  - Proctoring violation audit summary.

---

## 8. 🛠️ Admin Intelligence & Bulk Question Import Pipeline

Implemented in [`backend/routers/admin.py`](file:///e:/Project/smarthire-ai/backend/routers/admin.py) and [`AdminDashboard.jsx`](file:///e:/Project/smarthire-ai/frontend/src/pages/AdminDashboard.jsx):

- **Drag-and-Drop Document Ingestion:**
  - Administrators can drag and drop curriculum or question bank files in **PDF, DOCX, DOC, or TXT** formats.
  - In-memory parsing using `pdfplumber` and `python-docx` eliminates temporary file locks.
- **LLM-Powered Question Normalization (`openai/gpt-oss-120b`):**
  - Unstructured documents (numbered lists, tables, raw paragraphs) are parsed and normalized into structured 4-option MCQs with validated zero-indexed answer keys (`A=0, B=1, C=2, D=3`).
  - Batch transaction insertion into the SQL database with section assignment (`Analytical`, `Technical`, `Logical`, `Verbal`, `Quantitative`, `General`).
- **Platform Analytics & Broadcast Broadcasts:**
  - Real-time aggregation of student scores, registration timelines, and ATS score distributions.
  - Broadcast notifications dispatched directly into candidate notification bells via `notify()` service.

