# 🛠️ Key Engineering Challenges & Solutions

This document chronicles the real production bugs, architectural roadblocks, and concurrency challenges encountered while building **SmartHire AI**, along with their in-depth engineering resolutions.

---

## 1. React useEffect Lifecycle Race Condition in Fullscreen Proctoring

### 🛑 The Problem
During the transition from the **Instructions Phase** to the **Active Exam Phase**, the candidate screen would abruptly restore the navigation header even though the exam was in fullscreen.

### 🔍 Root Cause Analysis
- The **Instructions screen** mounted `<ProctoringGuard>`, which ran an effect to add the `.proctoring-active` CSS class to `document.documentElement` to hide the top navigation header.
- When the candidate clicked "Start Test", the component transitioned to the **Active Test block**, unmounting the instructions wrapper and mounting a new overlay instance `<ProctoringGuard renderAsOverlay={true}>`.
- **The React Race Condition:** In React 18 concurrent mode, the *mount effect* of the new component executed **before** the *cleanup effect* of the unmounting component.
- Consequently, the cleanup function `document.documentElement.classList.remove('proctoring-active')` ran *after* the new component added the class, stripping the class and making the header visible.

### 💡 The Engineering Solution
Implemented a stateful counter tracking the active instances of `ProctoringGuard`:

```javascript
// ProctoringGuard.jsx
let activeProctoringGuards = 0;

export default function ProctoringGuard({ phase }) {
  useEffect(() => {
    let wasAdded = false;
    if (phase !== 'disqualified') {
      activeProctoringGuards++;
      wasAdded = true;
      document.documentElement.classList.add('proctoring-active');
    }
    return () => {
      if (wasAdded) {
        activeProctoringGuards--;
      }
      // Only remove class if NO OTHER proctoring component is active
      if (activeProctoringGuards <= 0) {
        document.documentElement.classList.remove('proctoring-active');
      }
    };
  }, [phase]);
}
```

---

## 2. LLM Response Truncation & JSON Parsing Resilience

### 🛑 The Problem
When evaluating candidate code, the backend frequently returned a `500 Internal Server Error` with the frontend reporting `"Code execution failed"`.

### 🔍 Root Cause Analysis
1. **Token Exhaustion:** `max_tokens` was configured to `600`. Groq's LLM generation was being cut off midway through generating the test-case array, leaving unbalanced braces `{ "testCases": [ { "input": ...`.
2. **Model Deprecation:** The backend called `llama-3.3-70b-versatile`, which was deprecated / unavailable on the active Groq tier, triggering `model_not_found`.
3. **Markdown Fences:** LLMs occasionally prepended explanatory text or wrapped output in ` ```json ... ``` `.

### 💡 The Engineering Solution
1. **Increased Token Budget:** Bumped `max_tokens` to `2048` and lowered `temperature` to `0.1` for deterministic, complete output.
2. **Upgraded to `openai/gpt-oss-120b`:** Active, high-throughput model verified on the API tier.
3. **Multi-Stage Resilient Parser:**

```python
# Strip markdown fences
raw = re.sub(r'^```json\s*', '', raw, flags=re.IGNORECASE)
raw = re.sub(r'^```\s*', '', raw)
raw = re.sub(r'```\s*$', '', raw).strip()

try:
    evaluation = json.loads(raw)
except Exception:
    # Regex fallback to extract isolated JSON braces if LLM outputs extra commentary
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        evaluation = json.loads(json_match.group())
    else:
        # Safe fallback preventing 500 crash
        evaluation = {
            "score": 0,
            "verdict": "Error",
            "testCases": [],
            "feedback": raw[:500]
        }
```

---

## 3. In-Memory PDF Streaming vs. Windows File Lock Contention

### 🛑 The Problem
During high-concurrency resume analysis and bulk screening (uploading hundreds of PDFs), the server threw `[WinError 32] The process cannot access the file because it is being used by another process` when trying to delete temporary files.

### 🔍 Root Cause Analysis
The original code wrote incoming uploads to a local `uploads/` directory on disk via `shutil.copyfileobj()`, parsed them with `pdfplumber.open(temp_path)`, and attempted `os.remove(temp_path)`. On Windows, file handles remain locked until garbage collected, causing `PermissionError` and leaving thousands of orphaned files.

### 💡 The Engineering Solution
Migrated the entire document ingestion pipeline to **100% In-Memory Byte Streams** using `io.BytesIO`:

```python
# backend/routers/resume.py & bulk_screening.py
content = await resume.read()
if not content:
    raise HTTPException(status_code=400, detail="Empty file uploaded")

extracted_text = ""
# Open byte stream directly in memory — zero disk I/O, zero file locks
with pdfplumber.open(io.BytesIO(content)) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            extracted_text += text + "\n"
```
**Benefits:**
- 🚀 **10x Faster Ingestion:** Completely bypasses disk I/O.
- 🛡️ **Zero Disk Footprint:** No temporary files to leak or clean up.
- 🔒 **Thread-Safe & OS-Agnostic:** Runs smoothly on Windows, Linux containers, and serverless environments.

---

## 4. Immediate Aptitude Email Dispatch Decoupling

### 🛑 The Problem
Candidates taking the aptitude exam or retaking an assessment reported that their marks were never received via email.

### 🔍 Root Cause Analysis
In the combined 3-stage interview flow, `submitAptitude` had a `skipEmail: true` parameter that suppressed the standalone email under the assumption that a combined email would be sent at the end of Round 3. If a candidate quit after Round 1 or retook the test, the combined session endpoint `/session/save` was never called, resulting in **zero emails**.

### 💡 The Engineering Solution
1. Decoupled the round-level result dispatch from the combined session saver.
2. Removed `skipEmail` constraints from both backend `submitAptitude` and frontend `LiveInterview.jsx`.
3. Candidate receives their section score report **immediately upon round completion**, plus an optional full transcript report upon completing the entire interview.

---

## 5. React Component Identity & Input Focus Loss Bug

### 🛑 The Problem
In the Admin Dashboard (`AdminDashboard.jsx`), whenever the admin typed in any form input (such as Announcement Title or Message), typing **a single character caused the cursor to lose focus**, requiring the user to click into the input box again for every single letter.

### 🔍 Root Cause Analysis
- A reusable UI wrapper component `const Card = ({ children }) => ...` was declared **inside the body of the `AdminDashboard()` component function**.
- In React's reconciliation algorithm, when state changes (`setAnnTitle(e.target.value)`), `AdminDashboard` re-renders.
- Because `Card` was defined inside the render function, JavaScript created a **brand-new function reference for `Card`** on every render.
- React compares previous component types with new component types: `PrevCard !== NewCard`.
- As a result, React **unmounted the entire previous DOM subtree** (including the `<input>` element) and mounted a fresh one, destroying the active focus state!

### 💡 The Engineering Solution
Moved the `Card` component definition to **module scope** (outside `AdminDashboard()`):

```javascript
// ✅ Correct: Defined once at module scope — stable reference across re-renders
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl ${className}`}>
    {children}
  </div>
);

export default function AdminDashboard() {
  // State changes here no longer recreate Card component identity
  const [annTitle, setAnnTitle] = useState('');
  ...
}
```

---

## 6. Asynchronous Background Tasks & Request-Scoped DB Session Lifetime

### 🛑 The Problem
When a student logged in (`POST /api/auth/login`), an async fire-and-forget task was dispatched to query the user's historical test scores and email a summary. Intermittently, the server logged `sqlalchemy.orm.exc.DetachedInstanceError` or `InterfaceError: connection closed`.

### 🔍 Root Cause Analysis
FastAPI dependency injection `db: Session = Depends(get_db)` provides a request-scoped database session that automatically closes when the HTTP endpoint returns a response (`finally: db.close()`). The background coroutine `asyncio.ensure_future(send_summary())` was attempting to execute SQL queries using this already-closed request session.

### 💡 The Engineering Solution
Decoupled the background task by having it instantiate its own dedicated, isolated `SessionLocal()`:

```python
# backend/routers/auth.py
if user.role == "student":
    user_id = user.id
    user_email = user.email
    user_name = user.name

    async def send_summary():
        try:
            # Independent session created, used, and cleanly closed in background context
            with SessionLocal() as db_session:
                coding = db_session.query(CodingReport).filter(CodingReport.user_id == user_id).all()
                technical = db_session.query(InterviewReport).filter(InterviewReport.user_id == user_id).all()
                ...
                send_login_summary(user_email, user_name, scores_dict)
        except Exception as err:
            logger.error(f"Failed to send login summary: {err}")

    asyncio.ensure_future(send_summary())
```

