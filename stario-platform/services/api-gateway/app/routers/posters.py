"""Poster generation endpoints - Poster Maker."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user
from stario_common.models import JobStatus
from stario_common.redis_client import get_redis

router = APIRouter()


class PosterTemplate(BaseModel):
    id: str
    name: str
    category: str  # birthday, event, concert, motivational
    preview_url: str
    artist_id: Optional[str]  # If artist-specific
    is_premium: bool = False


class PosterGenerationRequest(BaseModel):
    template_id: Optional[str] = None
    artist_id: str
    style: str = "modern"  # modern, vintage, artistic, minimalist
    text: str
    secondary_text: Optional[str] = None
    user_photo_url: Optional[str] = None  # For personalized posters
    color_scheme: Optional[str] = None  # hex colors
    aspect_ratio: str = "1:1"  # 1:1, 9:16, 16:9, 4:5


class PosterGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_seconds: int


class PosterJobStatus(BaseModel):
    job_id: str
    status: str
    progress_percent: int
    poster_url: Optional[str]
    poster_url_hd: Optional[str]
    error_message: Optional[str]


class PosterResponse(BaseModel):
    id: str
    user_id: str
    artist_id: str
    template_id: Optional[str]
    poster_url: str
    poster_url_hd: str
    thumbnail_url: str
    style: str
    created_at: datetime


@router.get("/templates", response_model=list[PosterTemplate])
async def list_templates(
    category: Optional[str] = None,
    artist_id: Optional[str] = None,
    include_premium: bool = True,
):
    """List available poster templates."""
    return [
        PosterTemplate(
            id="tpl_001",
            name="Birthday Celebration",
            category="birthday",
            preview_url="https://storage.stario.uz/templates/birthday_001.jpg",
            artist_id=None,
            is_premium=False,
        ),
        PosterTemplate(
            id="tpl_002",
            name="Concert Vibes",
            category="concert",
            preview_url="https://storage.stario.uz/templates/concert_001.jpg",
            artist_id="art_001",
            is_premium=True,
        ),
        PosterTemplate(
            id="tpl_003",
            name="Motivational Quote",
            category="motivational",
            preview_url="https://storage.stario.uz/templates/motivation_001.jpg",
            artist_id=None,
            is_premium=False,
        ),
    ]


@router.post("/generate", response_model=PosterGenerationResponse)
async def generate_poster(
    request: PosterGenerationRequest,
    user: User = Depends(get_current_user),
):
    """
    Generate AI poster.

    Target generation time: ≤5 seconds per requirements.
    Uses SDXL (fine-tuned) for high-quality poster generation.
    """
    import uuid

    job_id = str(uuid.uuid4())

    redis = await get_redis()
    await redis.enqueue(
        "poster_generation",
        {
            "job_id": job_id,
            "user_id": user.id,
            "artist_id": request.artist_id,
            "template_id": request.template_id,
            "style": request.style,
            "text": request.text,
            "secondary_text": request.secondary_text,
            "user_photo_url": request.user_photo_url,
            "color_scheme": request.color_scheme,
            "aspect_ratio": request.aspect_ratio,
        },
    )

    return PosterGenerationResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        estimated_duration_seconds=4,  # Target <5s
    )


@router.get("/jobs/{job_id}", response_model=PosterJobStatus)
async def get_poster_job_status(
    job_id: str,
    user: User = Depends(get_current_user),
):
    """Get poster generation job status."""
    redis = await get_redis()
    job = await redis.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return PosterJobStatus(
        job_id=job_id,
        status=job.get("status", JobStatus.PENDING),
        progress_percent=job.get("progress", 0),
        poster_url=job.get("result", {}).get("poster_url"),
        poster_url_hd=job.get("result", {}).get("poster_url_hd"),
        error_message=job.get("error"),
    )


@router.get("", response_model=list[PosterResponse])
async def list_user_posters(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
):
    """List user's generated posters."""
    return [
        PosterResponse(
            id="pst_001",
            user_id=user.id,
            artist_id="art_001",
            template_id="tpl_001",
            poster_url="https://storage.stario.uz/posters/pst_001.jpg",
            poster_url_hd="https://storage.stario.uz/posters/pst_001_hd.jpg",
            thumbnail_url="https://storage.stario.uz/posters/pst_001_thumb.jpg",
            style="modern",
            created_at=datetime.utcnow(),
        )
    ]


@router.get("/{poster_id}", response_model=PosterResponse)
async def get_poster(
    poster_id: str,
    user: User = Depends(get_current_user),
):
    """Get poster details."""
    return PosterResponse(
        id=poster_id,
        user_id=user.id,
        artist_id="art_001",
        template_id="tpl_001",
        poster_url="https://storage.stario.uz/posters/pst_001.jpg",
        poster_url_hd="https://storage.stario.uz/posters/pst_001_hd.jpg",
        thumbnail_url="https://storage.stario.uz/posters/pst_001_thumb.jpg",
        style="modern",
        created_at=datetime.utcnow(),
    )


@router.delete("/{poster_id}")
async def delete_poster(
    poster_id: str,
    user: User = Depends(get_current_user),
):
    """Delete a poster."""
    return {"message": "Poster deleted", "poster_id": poster_id}


@router.post("/{poster_id}/download")
async def get_download_link(
    poster_id: str,
    quality: str = "hd",  # standard, hd, print (300dpi)
    format: str = "jpg",  # jpg, png, pdf
    user: User = Depends(get_current_user),
):
    """Get download link for poster."""
    return {
        "download_url": f"https://storage.stario.uz/downloads/{poster_id}_{quality}.{format}",
        "quality": quality,
        "format": format,
        "expires_in_seconds": 3600,
    }


@router.post("/{poster_id}/share")
async def get_share_link(
    poster_id: str,
    platform: str = "telegram",
    user: User = Depends(get_current_user),
):
    """Get shareable link for poster."""
    base_url = "https://app.stario.uz/poster"

    return {
        "share_url": f"{base_url}/{poster_id}",
        "image_url": f"https://storage.stario.uz/posters/{poster_id}.jpg",
        "telegram_share_url": f"https://t.me/share/url?url={base_url}/{poster_id}",
    }
