"""
Stario Video Generation Service - FastAPI Application

Integrates with LivePortrait and SadTalker for AI video generation.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, status
from prometheus_client import make_asgi_app
from pydantic import BaseModel

from stario_common.config import get_settings
from stario_common.logging import get_logger, setup_logging
from stario_common.metrics import get_metrics, track_ai_job
from stario_common.redis_client import get_redis
from stario_common.s3_client import get_s3

from .worker import VideoGenerationWorker
from .mock_ai import MockVideoGenerator

setup_logging("video-gen")
logger = get_logger(__name__)
settings = get_settings()

worker: Optional[VideoGenerationWorker] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    global worker
    logger.info("Starting Video Generation Service", version="1.0.0")

    # Initialize worker
    worker = VideoGenerationWorker()
    asyncio.create_task(worker.start())

    # Initialize metrics
    get_metrics("video-gen")

    yield

    # Cleanup
    if worker:
        await worker.stop()
    logger.info("Video Generation Service shutdown complete")


app = FastAPI(
    title="Stario Video Generation Service",
    description="AI video synthesis using LivePortrait/SadTalker",
    version="1.0.0",
    lifespan=lifespan,
)


# Models
class VideoGenerationJob(BaseModel):
    job_id: str
    user_id: str
    artist_id: str
    prompt_template_id: Optional[str]
    custom_message: str
    recipient_name: str
    occasion: str
    language: str
    duration_seconds: int


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress_percent: int
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    error_message: Optional[str]
    processing_time_ms: Optional[int]


class GenerateRequest(BaseModel):
    artist_id: str
    source_image_url: str
    audio_url: str
    duration_seconds: int = 15
    style: str = "natural"


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    estimated_time_seconds: int


# Health endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "video-gen",
        "version": "1.0.0",
        "ai_mode": settings.ai_mode,
    }


@app.get("/health/ready")
async def readiness_check():
    redis = await get_redis()
    try:
        await redis.client.ping()
        return {"ready": True, "redis": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Not ready: {str(e)}",
        )


# API endpoints
@app.post("/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """
    Start video generation.

    In production mode, calls LivePortrait/SadTalker.
    In mock mode, simulates generation with delay.
    """
    import uuid

    job_id = str(uuid.uuid4())

    redis = await get_redis()
    await redis.enqueue(
        "video_generation",
        {
            "job_id": job_id,
            "artist_id": request.artist_id,
            "source_image_url": request.source_image_url,
            "audio_url": request.audio_url,
            "duration_seconds": request.duration_seconds,
            "style": request.style,
        },
    )

    return GenerateResponse(
        job_id=job_id,
        status="queued",
        estimated_time_seconds=35,
    )


@app.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get video generation job status."""
    redis = await get_redis()
    job = await redis.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    result = job.get("result", {})
    return JobStatusResponse(
        job_id=job_id,
        status=job.get("status", "pending"),
        progress_percent=job.get("progress", 0),
        video_url=result.get("video_url"),
        thumbnail_url=result.get("thumbnail_url"),
        error_message=job.get("error"),
        processing_time_ms=result.get("processing_time_ms"),
    )


@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a pending video generation job."""
    redis = await get_redis()
    await redis.update_job(job_id, "cancelled")
    return {"message": "Job cancelled", "job_id": job_id}


@app.get("/queue/stats")
async def get_queue_stats():
    """Get queue statistics."""
    return {
        "queue_name": "video_generation",
        "pending_jobs": 5,
        "processing_jobs": 2,
        "completed_today": 150,
        "failed_today": 3,
        "average_processing_time_ms": 32000,
    }


# Internal endpoints for worker
@app.post("/internal/process")
async def process_job(job: VideoGenerationJob):
    """Internal endpoint for processing a job (called by worker)."""
    if settings.ai_mode == "mock":
        generator = MockVideoGenerator()
    else:
        # Production AI integration
        from .ai_client import AIVideoGenerator
        generator = AIVideoGenerator()

    result = await generator.generate(
        artist_id=job.artist_id,
        message=job.custom_message,
        recipient_name=job.recipient_name,
        occasion=job.occasion,
        duration_seconds=job.duration_seconds,
    )

    return result


# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
