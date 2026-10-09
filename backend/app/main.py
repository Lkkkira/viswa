import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.api.jobs import router as jobs_router
from backend.app.api.settings import router as settings_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FilePilot API",
    description="Intelligent File Organizer Backend API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FilePilot API v1.0"}
