"""
Stario Face Similarity Service - FastAPI Application

Target latency: ≤200ms per requirement.
Uses InsightFace for face recognition and similarity comparison.
"""

import asyncio
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, status
from prometheus_client import make_asgi_app
from pydantic import BaseModel

from stario_common.config import get_settings
from stario_common.logging import get_logger, setup_logging
from stario_common.metrics import get_metrics
from stario_common.s3_client import get_s3

setup_logging("face-similarity")
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    logger.info("Starting Face Similarity Service", version="1.0.0")
    get_metrics("face-similarity")
    yield
    logger.info("Face Similarity Service shutdown complete")


app = FastAPI(
    title="Stario Face Similarity Service",
    description="Face recognition and similarity comparison using InsightFace",
    version="1.0.0",
    lifespan=lifespan,
)


# Models
class CompareRequest(BaseModel):
    user_image_url: str
    artist_image_url: str
    artist_id: str


class CompareResponse(BaseModel):
    similarity_score: float  # 0.0 to 100.0
    matching_features: list[str]
    face_detected: bool
    processing_time_ms: int


class DetectRequest(BaseModel):
    image_url: str


class DetectResponse(BaseModel):
    faces_detected: int
    faces: list[dict]  # [{bbox, landmarks, confidence}]
    processing_time_ms: int


class BatchCompareRequest(BaseModel):
    user_image_url: str
    artist_ids: list[str]


class BatchCompareResponse(BaseModel):
    results: list[dict]  # [{artist_id, similarity_score}]
    best_match_artist_id: str
    best_match_score: float
    processing_time_ms: int


# Health endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "face-similarity",
        "version": "1.0.0",
        "target_latency_ms": 200,
    }


# API endpoints
@app.post("/compare", response_model=CompareResponse)
async def compare_faces(request: CompareRequest):
    """
    Compare user's face with artist's face.

    Target: ≤200ms processing time.
    """
    import random

    start_time = time.time()

    # Mock face comparison (in production, call InsightFace)
    if settings.ai_mode == "mock":
        # Simulate processing
        await asyncio.sleep(0.1)  # ~100ms mock latency

        similarity_score = random.uniform(45, 85)
        matching_features = random.sample(
            ["eyes", "nose", "lips", "face_shape", "jawline", "eyebrows"],
            k=random.randint(2, 4),
        )
    else:
        # Production: call InsightFace
        from .insightface_client import compare_faces_insightface
        result = await compare_faces_insightface(
            request.user_image_url,
            request.artist_image_url,
        )
        similarity_score = result["similarity"] * 100
        matching_features = result.get("features", [])

    processing_time_ms = int((time.time() - start_time) * 1000)

    # Log warning if exceeding target latency
    if processing_time_ms > 200:
        logger.warning(
            "Face comparison exceeded target latency",
            processing_time_ms=processing_time_ms,
            target_ms=200,
        )

    # Track metrics
    metrics = get_metrics()
    metrics.track_ai_job("face_comparison", "success", processing_time_ms / 1000)

    return CompareResponse(
        similarity_score=round(similarity_score, 1),
        matching_features=matching_features,
        face_detected=True,
        processing_time_ms=processing_time_ms,
    )


@app.post("/detect", response_model=DetectResponse)
async def detect_faces(request: DetectRequest):
    """Detect faces in an image."""
    import random

    start_time = time.time()

    if settings.ai_mode == "mock":
        await asyncio.sleep(0.05)

        faces = [
            {
                "bbox": [100, 100, 300, 300],
                "landmarks": [[150, 180], [250, 180], [200, 220], [160, 280], [240, 280]],
                "confidence": random.uniform(0.95, 0.99),
            }
        ]
    else:
        from .insightface_client import detect_faces_insightface
        faces = await detect_faces_insightface(request.image_url)

    processing_time_ms = int((time.time() - start_time) * 1000)

    return DetectResponse(
        faces_detected=len(faces),
        faces=faces,
        processing_time_ms=processing_time_ms,
    )


@app.post("/compare/batch", response_model=BatchCompareResponse)
async def batch_compare_faces(request: BatchCompareRequest):
    """Compare user's face with multiple artists."""
    import random

    start_time = time.time()

    results = []
    for artist_id in request.artist_ids:
        # In production, this would be optimized to compute user embedding once
        score = random.uniform(30, 90)
        results.append({
            "artist_id": artist_id,
            "similarity_score": round(score, 1),
        })

    # Find best match
    best_match = max(results, key=lambda x: x["similarity_score"])

    processing_time_ms = int((time.time() - start_time) * 1000)

    return BatchCompareResponse(
        results=results,
        best_match_artist_id=best_match["artist_id"],
        best_match_score=best_match["similarity_score"],
        processing_time_ms=processing_time_ms,
    )


@app.post("/upload")
async def upload_and_compare(
    file: UploadFile = File(...),
    artist_id: str = "",
):
    """Upload image and compare with artist."""
    import random
    import uuid

    start_time = time.time()

    # Save to S3
    s3 = get_s3()
    contents = await file.read()

    upload_key = f"face-quiz/{uuid.uuid4()}/{file.filename}"
    s3.upload_bytes(
        contents,
        settings.s3_bucket_uploads,
        upload_key,
        content_type=file.content_type or "image/jpeg",
    )

    # Get presigned URL
    user_image_url = s3.get_presigned_url(
        settings.s3_bucket_uploads,
        upload_key,
        expires_in=300,
    )

    # Compare
    similarity_score = random.uniform(45, 85)

    processing_time_ms = int((time.time() - start_time) * 1000)

    # Schedule ephemeral deletion (3 seconds per PII requirements)
    asyncio.create_task(_schedule_deletion(upload_key, delay_seconds=3))

    return {
        "similarity_score": round(similarity_score, 1),
        "artist_id": artist_id,
        "processing_time_ms": processing_time_ms,
        "image_will_be_deleted_in_seconds": 3,
    }


async def _schedule_deletion(key: str, delay_seconds: int):
    """Schedule ephemeral file deletion."""
    await asyncio.sleep(delay_seconds)
    try:
        s3 = get_s3()
        s3.delete_file(settings.s3_bucket_uploads, key)
        logger.info("Ephemeral file deleted", key=key)
    except Exception as e:
        logger.error("Failed to delete ephemeral file", key=key, error=str(e))


# Metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
