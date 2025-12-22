"""Face Quiz API - DeepFace-based face comparison service."""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.services.face_service import FaceService
from app.models import CompareResponse, HealthResponse


face_service: FaceService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    global face_service
    face_service = FaceService()
    yield


app = FastAPI(
    title="Face Quiz API",
    description="Compare faces with Uzbek celebrities using DeepFace",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        celebrities_count=face_service.celebrities_count if face_service else 0,
        total_photos=face_service.total_photos if face_service else 0
    )


@app.post("/compare", response_model=CompareResponse)
async def compare_face(file: UploadFile = File(...)):
    """
    Compare uploaded face with celebrity database.

    Returns top 3 matches with similarity percentages.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        results = await face_service.compare(file)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/celebrities")
async def list_celebrities():
    """List all celebrities in the database."""
    return {
        "celebrities": [
            {"name": name, "photos_count": len(photos)}
            for name, photos in face_service.celebrities.items()
        ],
        "total": face_service.celebrities_count
    }
