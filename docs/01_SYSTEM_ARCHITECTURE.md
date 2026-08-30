# 🏗️ System Architecture & Technology Stack Breakdown

This document details the architectural design, component interactions, database schemas, and the deep engineering rationale behind each technology choice in **SmartHire AI**.

---

## 1. High-Level Architecture

SmartHire AI utilizes a **decoupled, asynchronous microservice-oriented architecture** comprising three primary tiers:

```mermaid
graph TD
    Client["Client Layer<br/>(React 18 + Vite + Tailwind CSS + Monaco Editor)"]
    
    subgraph "Core Backend Services"
        FastAPI_Core["Core API & Signaling Server (Port 5000)<br/>FastAPI + Python-Socket.io ASGI"]
        AIService["AI Microservice (Port 8000)<br/>FastAPI + PDF Processing + ML Engine"]
    end
    
    subgraph "External Providers & Persistence"
        Groq["Groq Cloud Engine<br/>(openai/gpt-oss-120b Llama/GPT OSS Inference)"]
        DB[("Database Layer<br/>SQLAlchemy Engine: MySQL (Primary) ──► SQLite (Failover)")]
        SMTP["SMTP Mail Delivery<br/>(Gmail SMTP Gateway)"]
    end
    
    Client <==>|"REST HTTP/JSON & Socket.io (Signaling & Chat)"| FastAPI_Core
    Client -->|"Direct AI Tasks (Aptitude & Fake Skill)"| AIService
    FastAPI_Core -->|"Async HTTP Inferences (Evaluations & Recommendations)"| Groq
    AIService -->|"LLM Prompt Completion"| Groq
    FastAPI_Core <-->|"ORM Transactions & Connection Pooling"| DB
    FastAPI_Core -->|"Async Background Notification Workers"| SMTP
```

---

## 2. Technology Stack & Strategic Rationale

In product-based company system design interviews, you must justify **why** a specific tool was chosen over industry alternatives:

### 🖥️ Frontend Tier
| Technology | Role | Why Chosen Over Alternatives? |
|---|---|---|
| **React 18** | UI Framework | Component-level state encapsulation, Virtual DOM efficiency during rapid proctoring re-renders, and mature hooks ecosystem (`useRef`, `useCallback`) essential for timer loops and WebRTC streaming. |
| **Vite** | Build Tool | Native ES modules provide sub-second hot module replacement (HMR) and optimized Rollup tree-shaking, vastly superior to legacy Webpack. |
| **Monaco Editor** | Code Editor | The exact VS Code engine in the browser; provides syntax highlighting, indentation, auto-closing brackets, and language server support without heavy third-party plugins. |
| **Tailwind CSS v4** | Design System | Zero-runtime CSS footprint, CSS variables design token integration, fluid dark/light theme switching with custom variants. |
| **Lucide Icons & Web Speech API** | Voice & UX | Native browser SpeechRecognition eliminates latency and cost of cloud speech APIs for real-time candidate vocal answers. |

---

### ⚙️ Backend Tier (Core API & Real-Time)
| Technology | Role | Why Chosen Over Alternatives? |
|---|---|---|
| **FastAPI (Python 3.11+)** | Core Web Framework | Async ASGI concurrency powered by `uvicorn` and `Starlette`. Automatic OpenAPI documentation, Pydantic type validation, and 300% faster throughput than traditional Flask/Django. |
| **Python-SocketIO** | Real-Time Engine | Provides ASGI-compliant bidirectional WebSocket communication for WebRTC signaling (SDP offer/answer exchange, ICE candidates), live interview chat, and proctoring telemetry. |
| **SQLAlchemy 2.0** | Object-Relational Mapper | Decouples business logic from raw SQL dialects. Enables **Zero-Downtime Dynamic Database Failover** (MySQL $\rightarrow$ SQLite). |
| **Groq Cloud API (`openai/gpt-oss-120b`)** | LLM Engine | LPUs (Language Processing Units) achieve inference speeds of **500+ tokens/sec**, enabling near-instant real-time code evaluation and voice conversation generation without candidate delay. |
| **`pdfplumber` + `io.BytesIO`** | In-Memory Document Parser | 100% in-memory byte stream extraction eliminates disk I/O bottlenecks and Windows file-locking race conditions during multi-file concurrent uploads. |

---

## 3. Database Architecture & Dynamic Failover Strategy

### Schema Entity Relationship

```mermaid
erDiagram
    USER ||--o{ INTERVIEW : takes
    USER ||--o{ INTERVIEW_SESSION : completes
    USER ||--o{ RESUME : uploads
    USER ||--o{ RESUME_REPORT : receives
    USER ||--o{ CODING_REPORT : generates
    USER ||--o{ NOTIFICATION : receives
    
    USER {
        int id PK
        string email UK
        string password_hash
        string name
        string role
        datetime created_at
    }
    
    INTERVIEW_SESSION {
        int id PK
        int user_id FK
        json aptitude_result
        json coding_result
        json technical_result
        json overall_score
        int violations
        boolean disqualified
        datetime completed_at
    }
    
    CODING_REPORT {
        int id PK
        int user_id FK
        int problem_id
        string problem_title
        string language
        text code
        int score
        string verdict
        int test_cases_passed
        int test_cases_total
        json test_case_results
    }
```

### 🛡️ Dynamic Database Failover Mechanism (`database.py`)
To prevent the application from crashing if the local/production MySQL instance is down or credentials fail:
1. `create_engine()` attempts a connection to `DATABASE_URL` (MySQL).
2. If an `OperationalError` or `ConnectionRefusedError` occurs, the exception is caught immediately.
3. The engine automatically switches to a local SQLite database (`smarthire.db`), synchronizes all tables via `Base.metadata.create_all()`, and logs a seamless fallback alert.
4. **Result:** 100% availability for developers, testers, and production staging environments.

---

## 4. End-to-End User Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    participant Frontend as React Client
    participant Backend as FastAPI Core (Port 5000)
    participant Groq as Groq LLM Inference
    participant Mail as SMTP Email Service

    Candidate->>Frontend: Selects "AI Interview" & clicks Start
    Frontend->>Frontend: ProctoringGuard locks Fullscreen & verifies Cam/Mic
    Frontend->>Backend: POST /api/interview/aptitude (Fetch 3-tier MCQ Bank)
    Backend-->>Frontend: Returns Quantitative, Logical, Verbal questions
    
    Candidate->>Frontend: Completes Aptitude & Submits
    Frontend->>Backend: POST /api/interview/aptitude/submit
    Backend->>Backend: Evaluates category scores & computes %
    Backend-->>Mail: Spawns Async Task -> Dispatches Aptitude Score Email
    Backend-->>Frontend: Transition to Section 2 (Coding)
    
    Candidate->>Frontend: Writes code in Monaco Editor & Clicks "Run Code"
    Frontend->>Backend: POST /api/interview/evaluate-code (Code, Language, TestCases)
    Backend->>Groq: Evaluates code correctness, Big-O, edge cases
    Groq-->>Backend: Returns JSON {verdict, testCases, score}
    Backend-->>Frontend: Displays test-case status in Console drawer
    
    Candidate->>Frontend: Finishes all 3 sections (Aptitude + Coding + Tech Voice)
    Frontend->>Backend: POST /api/interview/session/save
    Backend->>Backend: Aggregates Combined Score (/150 pts)
    Backend-->>Mail: Dispatches Comprehensive Multi-Round PDF/HTML Report
    Backend-->>Frontend: Renders Final Completion Screen
```
