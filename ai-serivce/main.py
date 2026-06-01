from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume, prediction
from routers import roadmap

app = FastAPI(title="SmartHire AI Service", version="1.0.0")

# CORS — Node.js backend connect aaga
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["Prediction"])
app.include_router(roadmap.router, prefix="/api/roadmap")

@app.get("/")
def root():
    return {"message": "SmartHire AI Service running!", "version": "1.0.0"}