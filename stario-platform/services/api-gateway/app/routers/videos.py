"""Video generation endpoints - Stario Moment."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user
from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.models import JobStatus
from stario_common.redis_client import get_redis

router = APIRouter()
logger = get_logger(__name__)


class VideoGenerationRequest(BaseModel):
    artist_id: str
    prompt_template_id: Optional[str] = None
    custom_message: str
    recipient_name: str
    occasion: str = "greeting"  # birthday, greeting, congratulation, etc.
    language: str = "uz"
    duration_seconds: int = 15  # 15, 30, or 60


class VideoGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_seconds: int
    queue_position: int


class VideoJobStatus(BaseModel):
    job_id: str
    status: str
    progress_percent: int
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]


class VideoResponse(BaseModel):
    id: str
    user_id: str
    artist_id: str
    video_url: str
    thumbnail_url: str
    duration_seconds: int
    prompt_used: str
    status: str
    created_at: datetime
    expires_at: Optional[datetime]


@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    """
    Start video generation job.

    This creates a "Stario Moment" - an AI-generated video greeting
    from an artist to the recipient.
    """
    import uuid

    job_id = str(uuid.uuid4())
    settings = get_settings()

    # Queue the job
    redis = await get_redis()
    await redis.enqueue(
        "video_generation",
        {
            "job_id": job_id,
            "user_id": user.id,
            "artist_id": request.artist_id,
            "prompt_template_id": request.prompt_template_id,
            "custom_message": request.custom_message,
            "recipient_name": request.recipient_name,
            "occasion": request.occasion,
            "language": request.language,
            "duration_seconds": request.duration_seconds,
        },
    )

    logger.info(
        "video_generation_queued",
        job_id=job_id,
        user_id=user.id,
        artist_id=request.artist_id,
    )

    return VideoGenerationResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        estimated_duration_seconds=35,  # Target <40s
        queue_position=1,
    )


@router.get("/jobs/{job_id}", response_model=VideoJobStatus)
async def get_job_status(
    job_id: str,
    user: User = Depends(get_current_user),
):
    """Get video generation job status."""
    redis = await get_redis()
    job = await redis.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    # Mock progress for demo
    return VideoJobStatus(
        job_id=job_id,
        status=job.get("status", JobStatus.PENDING),
        progress_percent=job.get("progress", 0),
        video_url=job.get("result", {}).get("video_url"),
        thumbnail_url=job.get("result", {}).get("thumbnail_url"),
        error_message=job.get("error"),
        created_at=datetime.utcnow(),
        completed_at=None,
    )


@router.get("", response_model=list[VideoResponse])
async def list_user_videos(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
):
    """List user's generated videos."""
    # Mock data
    return [
        VideoResponse(
            id="vid_001",
            user_id=user.id,
            artist_id="art_001",
            video_url="https://storage.stario.uz/videos/vid_001.mp4",
            thumbnail_url="https://storage.stario.uz/thumbnails/vid_001.jpg",
            duration_seconds=15,
            prompt_used="Salom John! Tug'ilgan kuning bilan!",
            status="completed",
            created_at=datetime.utcnow(),
            expires_at=None,
        )
    ]


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    user: User = Depends(get_current_user),
):
    """Get video details."""
    return VideoResponse(
        id=video_id,
        user_id=user.id,
        artist_id="art_001",
        video_url="https://storage.stario.uz/videos/vid_001.mp4",
        thumbnail_url="https://storage.stario.uz/thumbnails/vid_001.jpg",
        duration_seconds=15,
        prompt_used="Salom John! Tug'ilgan kuning bilan!",
        status="completed",
        created_at=datetime.utcnow(),
        expires_at=None,
    )


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    user: User = Depends(get_current_user),
):
    """Delete a video."""
    return {"message": "Video deleted", "video_id": video_id}


@router.post("/{video_id}/share")
async def get_share_link(
    video_id: str,
    platform: str = "telegram",  # telegram, whatsapp, link
    user: User = Depends(get_current_user),
):
    """Get shareable link for video."""
    base_url = "https://app.stario.uz/share"

    if platform == "telegram":
        share_url = f"https://t.me/share/url?url={base_url}/{video_id}"
    elif platform == "whatsapp":
        share_url = f"https://wa.me/?text=Check%20out%20my%20Stario%20Moment!%20{base_url}/{video_id}"
    else:
        share_url = f"{base_url}/{video_id}"

    return {
        "share_url": share_url,
        "direct_url": f"{base_url}/{video_id}",
        "platform": platform,
    }


@router.post("/{video_id}/download")
async def get_download_link(
    video_id: str,
    quality: str = "hd",  # sd, hd, 4k
    user: User = Depends(get_current_user),
):
    """Get download link for video."""
    return {
        "download_url": f"https://storage.stario.uz/downloads/{video_id}_{quality}.mp4",
        "quality": quality,
        "expires_in_seconds": 3600,
    }
