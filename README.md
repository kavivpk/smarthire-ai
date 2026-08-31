# 🚀 SmartHire AI — Placement & Hiring Intelligence Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/Groq_LLM-F55036?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**SmartHire AI** is an enterprise-grade, end-to-end AI placement assessment, candidate screening, anti-cheat live proctoring, and recruitment intelligence ecosystem. It unifies automated ATS resume scoring, dynamic multi-round AI interviews, Monaco-based coding execution, WebRTC live collaborative interview rooms, and bulk resume screening into a single high-throughput platform.

---

## 📑 Table of Contents
- [🌟 Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Directory Structure](#-project-directory-structure)
- [💻 Local Development Setup](#-local-development-setup)
- [☁️ Cloud Deployment Guide (Vercel & Render)](#️-cloud-deployment-guide-vercel--render)
  - [1. Deploy AI-Service on Render](#1-deploy-ai-service-on-render)
  - [2. Deploy Backend on Render](#2-deploy-backend-on-render)
  - [3. Deploy Frontend on Vercel](#3-deploy-frontend-on-vercel)
- [🔐 Environment Variables Reference](#-environment-variables-reference)
- [👑 Admin Credentials & Security](#-admin-credentials--security)
- [📚 In-Depth Technical Documentation](#-in-depth-technical-documentation)

---

## 🌟 Key Features

### 1. 🤖 3-Stage AI Interview Studio
- **Round 1: Adaptive Aptitude Assessment:** 3 timed categories (Quantitative, Logical, Verbal) with custom curriculum PDF ingestion and instant score breakdown emails.
- **Round 2: Interactive Coding Runner:** Embedded Monaco Editor with multi-language support (Python, Java, C++, JavaScript) evaluated deterministically by Groq (`openai/gpt-oss-120b`) for correctness, edge cases, and Big-O Time/Space Complexity.
- **Round 3: AI Technical Voice Interview:** Resume-specific dynamic questioning with real-time SpeechRecognition (STT), text-to-speech feedback, and conversational follow-ups.

### 2. 📹 HR Real-Time WebRTC Live Interview
- Peer-to-peer encrypted audio/video streaming via WebRTC with Socket.io signaling.
- Real-time collaborative code editor with instant keystroke synchronization (`code_change` / `code_update`).
- Live AI question suggestions for recruiters and manual evaluation scorecard submission.

### 3. 🛡️ Anti-Cheat Proctoring Guard Engine
- Dual-layer fullscreen lockdown and background tab-switch tracking (`document.hidden` / `window.onblur`).
- Client-side face presence monitoring using HTML5 Canvas.
- 3-strike circuit breaker with automatic session termination and partial score persistence.

### 4. 📄 ATS Resume Analyzer & Skill Gap Detection
- 100% in-memory streaming text extraction (`io.BytesIO`) using `pdfplumber` without disk I/O bottlenecks.
- Algorithmic keyword extraction across 500+ tech taxonomy skills, formatting feedback, and actionable career roadmap.

### 5. 🔍 AI Fake Skill & Exaggeration Detector
- Semantic cross-correlation of listed skills against project narratives to identify buzzword stuffing and unverified credentials.

### 6. 📁 Bulk Resume Screening Engine (1,000 Resumes)
- Recursive folder drag-and-drop ingestion (`webkitdirectory`) to parse up to 1,000 resumes concurrently against custom job requirements with one-click CSV export.

### 7. 🛠️ Admin Intelligence & Bulk Question Import
- Drag-and-drop question bank import from **PDF, DOCX, DOC, or TXT** files.
- Automated LLM-driven question parsing and section assignment (`Analytical`, `Logical`, `Technical`, etc.).
- Platform analytics and instant broadcast notifications to all registered candidates.

---

## 🏗️ System Architecture

```
                                 ┌────────────────────────┐
                                 │   Frontend (Vercel)    │
                                 │  React 18 + Vite + CSS │
                                 └───────────┬────────────┘
                                             │ HTTP REST / WebSockets
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │                Backend API (Render)                    │
                 │         FastAPI + Uvicorn + Python Socket.IO           │
                 └───────────┬───────────────────────────────┬────────────┘
                             │                               │
                Internal API │                  SQLAlchemy   │ Auto-Failover
                             ▼                               ▼
       ┌───────────────────────────┐           ┌─────────────────────────────┐
       │   AI-Service (Render)     │           │    MySQL / SQLite Fallback  │
       │ FastAPI + Scikit-Learn    │           │    User & Assessment DB     │
       │ + Groq LLM Inference      │           └─────────────────────────────┘
       └───────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS / TailwindCSS, Monaco Code Editor, Socket.io-client, Chart.js |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn (ASGI), SQLAlchemy, Python-SocketIO, PyJWT, Passlib/Bcrypt, pdfplumber, python-docx, aiosmtplib |
| **AI / ML Service** | FastAPI, Scikit-learn, Pandas, NumPy, Groq API (`openai/gpt-oss-120b`), pdfplumber, python-docx |
| **Database** | MySQL (with automatic zero-downtime SQLite local fallback) |
| **Deployment** | **Vercel** (Frontend) + **Render** (Backend & AI-Service) |

---

## 📂 Project Directory Structure

```
smarthire-ai/
├── frontend/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/           # Header, ProctoringGuard, ThemeToggle, etc.
│   │   ├── pages/                # Dashboard, Resume, Interview, Admin, BulkScreening, etc.
│   │   ├── services/             # Axios API client, Socket.io, Firebase
│   │   └── config/               # API base URLs & endpoints
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Core FastAPI + Socket.IO Backend
│   ├── models/                   # SQLAlchemy ORM Models (User, Interview, Resume, etc.)
│   ├── routers/                  # API Routers (auth, interview, resume, admin, etc.)
│   ├── services/                 # Email, ATS scoring, notifications, recommendations
│   ├── middleware/               # JWT authentication & admin authorization guards
│   ├── database.py               # SQLAlchemy engine with automatic SQLite fallback
│   ├── main.py                   # FastAPI + Socket.IO ASGI server
│   └── requirements.txt          # Production dependencies
├── ai-service/                   # Dedicated AI / ML Evaluation Microservice
│   ├── routers/                  # Fake skill detection, aptitude generator, prediction
│   ├── services/                 # Resume analysis, placement ML prediction
│   ├── main.py                   # FastAPI microservice entry point
│   └── requirements.txt          # ML & LLM dependencies
├── docs/                         # Comprehensive Product-Based Interview & Architecture Docs
│   ├── 00_MASTER_OVERVIEW.md
│   ├── 01_SYSTEM_ARCHITECTURE.md
│   ├── 02_CORE_MODULES_DEEP_DIVE.md
│   ├── 03_KEY_ENGINEERING_CHALLENGES.md
│   └── 04_INTERVIEW_CRACK_GUIDE.md
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** 18+ & `npm`
- **Python** 3.11+
- **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/kavivpk/smarthire-ai.git
cd smarthire-ai
```

### Step 2: Configure Environment Files
Copy the `.env.example` templates in each folder:

```bash
# Windows PowerShell
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
copy ai-service\.env.example ai-service\.env
```

### Step 3: Setup & Start Backend (Port 5000)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:sio_app --reload --port 5000
```

### Step 4: Setup & Start AI-Service (Port 8000)
Open a new terminal:
```bash
cd ai-service
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 5: Setup & Start Frontend (Port 5173)
Open a third terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## ☁️ Cloud Deployment Guide (Vercel & Render)

Follow these exact steps to deploy the entire ecosystem to production for **FREE**:

```
[ Step 1: AI-Service ] ──► [ Step 2: Backend API ] ──► [ Step 3: Frontend UI ]
  (Deploy on Render)          (Deploy on Render)          (Deploy on Vercel)
```

---

### 1. Deploy AI-Service on Render

1. Sign up/Log in to [Render](https://render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `kavivpk/smarthire-ai`.
4. Configure the Web Service settings:
   - **Name:** `smarthire-ai-service`
   - **Root Directory:** `ai-service`
   - **Language / Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PYTHON_VERSION=3.11.9
   ```
6. Click **Deploy Web Service**.
7. Copy your deployed AI Service URL (e.g., `https://smarthire-ai-service.onrender.com`).

---

### 2. Deploy Backend on Render

1. On [Render](https://render.com/), click **New +** $\rightarrow$ **Web Service**.
2. Select your repository: `kavivpk/smarthire-ai`.
3. Configure the Web Service settings:
   - **Name:** `smarthire-backend`
   - **Root Directory:** `backend`
   - **Language / Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:sio_app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
4. Under **Environment Variables**, add:
   ```env
   PORT=5000
   JWT_SECRET=smarthire_secret_key_2026_prod
   ADMIN_SECRET=smarthire2026
   GROQ_API_KEY=your_groq_api_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=https://your-frontend.vercel.app
   AI_SERVICE_URL=https://smarthire-ai-service.onrender.com
   DATABASE_URL=sqlite:///./smarthire.db
   PYTHON_VERSION=3.11.9
   ```
   *(Note: If using cloud MySQL like Aiven or AWS RDS, set `DATABASE_URL=mysql+pymysql://user:pass@host:port/dbname`. Otherwise, the server will automatically use persistent SQLite).*
5. Click **Deploy Web Service**.
6. Copy your deployed Backend URL (e.g., `https://smarthire-backend.onrender.com`).

---

### 3. Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository: `kavivpk/smarthire-ai`.
4. Configure Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://smarthire-backend.onrender.com/api
   VITE_AI_SERVICE_URL=https://smarthire-ai-service.onrender.com
   ```
6. Click **Deploy**.
7. Once deployed, copy your live frontend domain (e.g., `https://smarthire-ai.vercel.app`) and update the `FRONTEND_URL` environment variable on Render in your Backend service settings!

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `PORT` | Server listening port | `5000` | Yes |
| `DATABASE_URL` | MySQL connection URI or SQLite fallback | `mysql+pymysql://root:pass@localhost:3306/smarthire_db` | Yes |
| `JWT_SECRET` | Secret key for signing candidate access tokens | `smarthire_secret_key_2026` | Yes |
| `ADMIN_SECRET` | Secret key required to register an Admin role | `smarthire2024` or `smarthire2026` | Yes |
| `GROQ_API_KEY` | Groq LLM API Key (`openai/gpt-oss-120b`) | `gsk_...` | Yes |
| `EMAIL_USER` | SMTP sender email address | `example@gmail.com` | Optional |
| `EMAIL_PASS` | SMTP 16-character App Password | `xxxx xxxx xxxx xxxx` | Optional |
| `FRONTEND_URL` | Comma-separated CORS allowed origins | `http://localhost:5173,https://app.vercel.app` | Yes |
| `AI_SERVICE_URL` | URL of the internal AI-Service | `http://localhost:8000` | Yes |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `VITE_API_URL` | Base endpoint for backend API | `http://localhost:5000/api` | Yes |
| `VITE_AI_SERVICE_URL` | Base endpoint for AI microservice | `http://localhost:8000` | Yes |

---

## 👑 Admin Credentials & Security

- **Admin Registration:** Navigate to `/register`, select role **Admin**, and provide the Admin Secret Key (`smarthire2024` or `smarthire2026`).
- **Role Redirection:** Admins are automatically routed to the comprehensive `/admin` control dashboard.
- **Password Reset:** Administrators can reset passwords via the protected endpoint `POST /api/auth/set-password` using the `ADMIN_SECRET`.

---

## 📚 In-Depth Technical Documentation

For deep technical learning, architecture diagrams, and FAANG/Product-Based Company interview preparation, refer to the [`docs/`](file:///e:/Project/smarthire-ai/docs) suite:

- 📖 [**`00_MASTER_OVERVIEW.md`**](file:///e:/Project/smarthire-ai/docs/00_MASTER_OVERVIEW.md) — Comprehensive platform summary and documentation index.
- 🏗️ [**`01_SYSTEM_ARCHITECTURE.md`**](file:///e:/Project/smarthire-ai/docs/01_SYSTEM_ARCHITECTURE.md) — Multi-tier microservice architecture, tech stack justification, and sequence flows.
- 🔍 [**`02_CORE_MODULES_DEEP_DIVE.md`**](file:///e:/Project/smarthire-ai/docs/02_CORE_MODULES_DEEP_DIVE.md) — Line-by-line breakdown of Aptitude, Coding Engine, WebRTC, Proctoring, and ATS algorithms.
- 🛠️ [**`03_KEY_ENGINEERING_CHALLENGES.md`**](file:///e:/Project/smarthire-ai/docs/03_KEY_ENGINEERING_CHALLENGES.md) — In-depth analysis of 6 major production bugs and their solutions.
- 🏆 [**`04_INTERVIEW_CRACK_GUIDE.md`**](file:///e:/Project/smarthire-ai/docs/04_INTERVIEW_CRACK_GUIDE.md) — 90-second STAR project pitch, 35+ technical Q&As, scalability to 100k users, and trade-off matrices.

---

## 📄 License
This project is licensed under the **MIT License**.
