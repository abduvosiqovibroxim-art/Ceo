"""AI Poster Maker API - Main Application."""

import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import get_settings
from app.models import (
    FaceUploadResponse, GenerateRequest, GenerateResponse,
    CelebritiesResponse, TemplatesResponse, HealthResponse,
    CelebrityCategory
)
from app.services.face_swap_service import FaceSwapService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instance
face_swap_service: FaceSwapService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global face_swap_service
    logger.info("Starting AI Poster Maker API...")
    face_swap_service = FaceSwapService()
    logger.info("FaceSwapService initialized")
    yield
    logger.info("Shutting down AI Poster Maker API...")


app = FastAPI(
    title="AI Poster Maker API",
    description="Create personalized posters with celebrities using AI face swap",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
settings = get_settings()
temp_dir = settings.base_dir / settings.temp_dir
temp_dir.mkdir(exist_ok=True)
app.mount("/temp", StaticFiles(directory=str(temp_dir)), name="temp")

# Mount celebrities images from face-quiz data
celebrities_dir = settings.base_dir / settings.celebrities_path
if celebrities_dir.exists():
    app.mount("/celebrities", StaticFiles(directory=str(celebrities_dir)), name="celebrities")
else:
    logger.warning(f"Celebrities directory not found: {celebrities_dir}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        celebrities_count=len(face_swap_service.get_celebrities()),
        templates_count=len(face_swap_service.get_templates()),
        face_swap_ready=face_swap_service.is_ready()
    )


@app.post("/upload-face", response_model=FaceUploadResponse)
async def upload_face(file: UploadFile = File(...)):
    """
    Upload user's photo for face detection.

    Returns face_id to use in generation.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Use: {settings.allowed_extensions}"
        )

    # Read file
    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.max_file_size // 1024 // 1024}MB"
        )

    # Process face
    result = await face_swap_service.upload_face(content, file.filename)
    return result


@app.post("/generate", response_model=GenerateResponse)
async def generate_poster(request: GenerateRequest):
    """
    Start poster generation job.

    Returns job_id to track progress.
    """
    result = await face_swap_service.start_generation(
        face_id=request.face_id,
        celebrity_id=request.celebrity_id,
        template_id=request.template_id
    )
    return result


@app.get("/job/{job_id}", response_model=GenerateResponse)
async def get_job_status(job_id: str):
    """Get generation job status."""
    result = face_swap_service.get_job_status(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    return result


@app.get("/celebrities", response_model=CelebritiesResponse)
async def get_celebrities(
    category: CelebrityCategory = Query(None, description="Filter by category")
):
    """Get list of available celebrities."""
    celebrities = face_swap_service.get_celebrities(category)
    return CelebritiesResponse(
        celebrities=celebrities,
        total=len(celebrities)
    )


@app.get("/templates", response_model=TemplatesResponse)
async def get_templates():
    """Get list of available poster templates."""
    templates = face_swap_service.get_templates()
    return TemplatesResponse(
        templates=templates,
        total=len(templates)
    )


@app.get("/download/{job_id}")
async def download_poster(job_id: str):
    """Download generated poster."""
    job = face_swap_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Poster not ready yet")

    result_path = temp_dir / f"{job_id}_result.jpg"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Poster file not found")

    return FileResponse(
        path=str(result_path),
        filename=f"poster_{job_id}.jpg",
        media_type="image/jpeg"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
