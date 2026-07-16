# SmartHire AI 🚀

SmartHire AI is an advanced, AI-powered placement preparation platform designed to help students and professionals excel in their career journey. It provides a comprehensive suite of tools ranging from automated resume analysis to live collaborative interviews and machine learning-powered placement predictions.

## 🌟 Key Features

1. **AI Resume Analysis (ATS)** 📄
   - Automatically parses PDF resumes.
   - Computes an ATS score based on keywords and formatting.
   - Highlights missing skills to help you pass automated screening.

2. **Aptitude & AI Mock Interviews** 🤖
   - Auto-generated technical, analytical, and logical reasoning tests.
   - Interactive mock interviews for 5 customizable topics.
   - Real-time scoring and email result notifications with section-wise breakdowns.

3. **Fake Skill Detection** 🔍
   - Validates skills claimed on the resume through targeted AI-generated questions.
   - Prevents resume padding by assessing actual competency in real-time.

4. **Live Collaborative Interviews** 💻
   - **Video/Audio Calling**: Seamless WebRTC-based communication.
   - **Live Code Editor**: Real-time collaborative coding environment.
   - **Screen Sharing**: Effortless sharing for system design and presentations.
   - **Admin Controls**: Interviewers can push questions to candidates and submit manual evaluation scores.
   
5. **Admin Dashboard** 👑
   - **Analytics**: Track student progress, total interviews, and average scores.
   - **Dynamic Question Management**: Easily upload new aptitude questions to the database which will automatically rotate into student exams.
   - **Secure Access**: Admin registration is protected by a secret key to prevent unauthorized access.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Monaco Editor
- **Backend**: Node.js, Express, MongoDB, Socket.io, Nodemailer, JSON Web Tokens (JWT)
- **AI Service**: Python, FastAPI, scikit-learn, Groq (Llama-3 models)

## 🚀 Local Setup

### 1. Environment Configuration

Create environment files from the provided examples in each directory:

```powershell
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
copy ai-service\.env.example ai-service\.env
```

**Backend (`backend/.env`)**
- `PORT=5000`
- `MONGO_URI=mongodb://127.0.0.1:27017/smarthire-ai`
- `JWT_SECRET=your-secret-key`
- `FRONTEND_URL=http://localhost:5173`
- `EMAIL_USER=your-email@gmail.com`
- `EMAIL_PASS=your-app-password`
- `ADMIN_SECRET=smarthire2024` (Required to register an admin account)

**Frontend (`frontend/.env`)**
- `VITE_API_URL=http://localhost:5000/api`
- `VITE_AI_SERVICE_URL=http://localhost:8000`
- `VITE_FIREBASE_API_KEY=...` (Add your Firebase config if you use Google Auth)

**AI Service (`ai-service/.env`)**
- `GROQ_API_KEY=your_groq_api_key`

### 2. Install Dependencies

**Frontend:**
```powershell
cd frontend
npm install
```

**Backend:**
```powershell
cd backend
npm install
```

**AI Service:**
```powershell
cd ai-service
pip install -r requirements.txt
```

### 3. Start the Services

Open three separate terminals and start the development servers:

**Backend:**
```powershell
cd backend
npm run dev
```

**AI Service:**
```powershell
cd ai-service
venv\Scripts\activate
uvicorn main:app --reload --port 8000
``` 

**Frontend:**
```powershell
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🌐 Deployment

For deploying to production, follow these recommended platforms:

- **Frontend**: [Vercel](https://vercel.com/) (Root: `frontend`, Build: `npm run build`, Output: `dist`)
- **Backend**: [Render](https://render.com/) (Root: `backend`, Build: `npm ci --omit=dev`, Start: `npm start`)
- **AI Service**: [Railway](https://railway.app/) (Deploy via Dockerfile in `ai-service`)
- **Database**: MongoDB Atlas

*Ensure all environment variables are correctly set in the deployment platforms matching the production URLs.*

## 📈 Recent Improvements & Fixes

- 🔒 **Admin Security**: Added `ADMIN_SECRET` verification to block standard users from gaining admin access.
- 📊 **Enhanced Email Reports**: Aptitude test result emails now include a detailed section-by-section breakdown.
- ✏️ **Dynamic Question Engine**: Admins can now add custom aptitude questions directly via the Admin Dashboard GUI.
- 🎨 **UI/UX Polish**: Improved light/dark mode visibility, fixed component overflows, layout tweaks for seamless workflow.
