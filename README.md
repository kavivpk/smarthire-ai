# SmartHire AI

AI-powered placement preparation platform with resume analysis, mock interviews, placement prediction, fake skill detection, live interviews, and admin analytics.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, JWT, Socket.io, Nodemailer
- AI service: FastAPI, scikit-learn, Groq

## Local Setup

1. Create environment files from the examples:

```powershell
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
copy ai-service\.env.example ai-service\.env
```

2. Install dependencies:

```powershell
cd frontend
npm install

cd ..\backend
npm install

cd ..\ai-service
pip install -r requirements.txt
```

3. Start services:

```powershell
cd backend
npm run dev

cd ..\ai-service
uvicorn main:app --reload --port 8000

cd ..\frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- AI service: `http://localhost:8000`

## Environment Variables

Frontend:

- `VITE_API_URL`: backend API URL, for example `http://localhost:5000/api`
- `VITE_AI_SERVICE_URL`: FastAPI service URL, for example `http://localhost:8000`

Backend:

- `PORT`: backend port
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: allowed frontend origins, comma-separated for multiple domains
- `EMAIL_USER`: Gmail sender account
- `EMAIL_PASS`: Gmail app password

AI service:

- `GROQ_API_KEY`: Groq API key used by roadmap and fake skill detection

## Deployment

Recommended beginner path:

- Frontend: Vercel, root directory `frontend`, build command `npm run build`, output `dist`
- Backend: Render, root directory `backend`, build command `npm ci --omit=dev`, start command `npm start`
- AI service: Railway, root directory `ai-service`, Dockerfile deploy
- Database: MongoDB Atlas

After deployment, set:

- `frontend/.env`: `VITE_API_URL=https://your-backend.onrender.com/api`
- `frontend/.env`: `VITE_AI_SERVICE_URL=https://your-ai-service.up.railway.app`
- `backend/.env`: `FRONTEND_URL=https://your-frontend.vercel.app`

## Completed Fixes

- Admin stats now average saved interview `totalScore` values correctly.
- Admin routes are mounted at `/api/admin`.
- Live interview email invites validate required fields and use the saved user name/email when available.
- Frontend service URLs are environment-driven for deployment.
