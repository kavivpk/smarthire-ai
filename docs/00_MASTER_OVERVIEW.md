# 🚀 SmartHire AI — Complete Project Documentation

Welcome to the comprehensive technical documentation for **SmartHire AI** — an enterprise-grade, end-to-end AI-powered hiring, interview assessment, proctoring, and placement intelligence ecosystem.

---

## 📑 Documentation Structure

This documentation suite is organized into 5 dedicated modules designed for deep learning, technical mastery, and cracking **Product-Based Company (PBC) / Tier-1 Tech Interviews**:

| File | Focus Area | Description |
|---|---|---|
| [**`00_MASTER_OVERVIEW.md`**](file:///e:/Project/smarthire-ai/docs/00_MASTER_OVERVIEW.md) | **Overview & Summary** | Project executive summary, feature catalog, and documentation index. |
| [**`01_SYSTEM_ARCHITECTURE.md`**](file:///e:/Project/smarthire-ai/docs/01_SYSTEM_ARCHITECTURE.md) | **System Architecture** | Microservice breakdown, Tech Stack Rationale, Mermaid sequence flows, Database Schema & Failover mechanics. |
| [**`02_CORE_MODULES_DEEP_DIVE.md`**](file:///e:/Project/smarthire-ai/docs/02_CORE_MODULES_DEEP_DIVE.md) | **Module Implementation** | Line-by-line breakdown of Aptitude, Coding Runner, AI Technical Voice, WebRTC HR Live Interview, Proctoring Guard, Resume ATS, and Bulk Screening (1000+ files). |
| [**`03_KEY_ENGINEERING_CHALLENGES.md`**](file:///e:/Project/smarthire-ai/docs/03_KEY_ENGINEERING_CHALLENGES.md) | **Hard Engineering Problems** | Real production challenges solved: React useEffect race conditions, In-Memory PDF streaming, LLM JSON sanitization, WebSocket synchronization, and DB failovers. |
| [**`04_INTERVIEW_CRACK_GUIDE.md`**](file:///e:/Project/smarthire-ai/docs/04_INTERVIEW_CRACK_GUIDE.md) | **FAANG/PBC Interview Defense** | STAR framework project pitch, 35+ in-depth System Design & Concurrency Q&As, Scaling to 100k users, and trade-off matrices. |

---

## 🌟 Executive Summary: What is SmartHire AI?

**SmartHire AI** replaces traditional, fragmented recruitment funnels with a single, synchronized, AI-supervised platform that automates candidate screening, live multi-round assessments, automated coding evaluation, real-time proctoring, and AI-driven placement recommendation.

### 🎯 Key Capabilities at a Glance

```
Candidate Funnel:
[ Resume Upload ] ──► [ ATS & Fake Skill Audit ] ──► [ AI Interview Studio (Aptitude + Coding + Voice Q&A) ]
                                                                 │
                                                    (Proctoring Guard: Face + Fullscreen + Tab Lock)
                                                                 ▼
[ Recruiter Analytics ] ◄── [ Automated PDF/Email Report ] ◄── [ Multi-Dimensional Score Aggregator ]
```

1. **AI Interview Studio (3-Tier Sequential Flow):**
   - **Section 1: Dynamic Aptitude Test** (Custom time limits per section, PDF-based question generator via LLMs).
   - **Section 2: Interactive Code Execution & Evaluation** (Monaco editor, multi-language support, automated test-case evaluation with LLM reasoning).
   - **Section 3: AI Technical Voice Interview** (Voice speech-to-text, resume-specific personalized questions, dynamic follow-up questioning, real-time audio evaluation).
2. **HR Real-Time WebRTC Live Interview:**
   - Peer-to-peer audio/video streaming via WebRTC with Socket.io signaling.
   - Live collaborative code editor, AI-assisted question generation for interviewers, and real-time candidate scorecards.
3. **Advanced Anti-Cheat Proctoring Engine:**
   - Real-time face presence tracking.
   - Dual-layer fullscreen lockdown and background tab-switch tracking.
   - 3-strike disqualification circuit breaker with partial score persistence.
4. **ATS Resume Analyzer & Skill Gap Detection:**
   - 100% In-memory PDF text extraction without disk I/O bottlenecks.
   - Term frequency and keyword matching against top industry skill taxonomies.
   - LLM-powered structural feedback, formatting audit, and actionable career roadmap.
5. **AI Fake Skill & Exaggeration Detector:**
   - Cross-references project descriptions against claimed skills to detect buzzword stuffing and unverified credentials.
6. **Bulk Resume Screening Engine:**
   - Handles **up to 1,000 resumes** in a single directory upload.
   - Parallel parsing with custom job requirement matching, threshold filtering, and CSV export.
7. **Automated Notification & Email Delivery Pipeline:**
   - Instant HTML result dispatches via SMTP with full section-by-section score breakdowns.
