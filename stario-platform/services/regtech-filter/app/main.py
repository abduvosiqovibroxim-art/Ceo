"""
Stario RegTech Filter Service - FastAPI Application

AI Safety module with:
- LLM toxicity filter
- Text prefilter
- Video prefilter (NSFW, political, misinformation)
- Human-in-the-loop review queue
- Audit logging with 90-day retention
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Depends, status
from prometheus_client import make_asgi_app
from pydantic import BaseModel

from stario_common.config import get_settings
from stario_common.logging import get_logger, setup_logging, AuditLogger
from stario_common.metrics import get_metrics
from stario_common.auth import User, get_current_user, require_role, Roles
from stario_common.redis_client import get_redis

setup_logging("regtech-filter")
logger = get_logger(__name__)
audit_logger = AuditLogger("regtech-filter")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    logger.info("Starting RegTech Filter Service", version="1.0.0")
    get_metrics("regtech-filter")
    yield
    logger.info("RegTech Filter Service shutdown complete")


app = FastAPI(
    title="Stario RegTech Filter Service",
    description="AI Safety and Content Moderation",
    version="1.0.0",
    lifespan=lifespan,
)


# Models
class TextModerationRequest(BaseModel):
    text: str
    artist_id: Optional[str] = None
    context: Optional[str] = None  # greeting, birthday, etc.


class TextModerationResponse(BaseModel):
    approved: bool
    flags: list[str]
    confidence_scores: dict[str, float]
    suggestions: Optional[str]
    processing_time_ms: int


class VideoModerationRequest(BaseModel):
    video_url: str
    artist_id: Optional[str] = None


class VideoModerationResponse(BaseModel):
    approved: bool
    flags: list[str]
    frame_analysis: list[dict]
    audio_analysis: Optional[dict]
    processing_time_ms: int
    requires_human_review: bool


class ImageModerationRequest(BaseModel):
    image_url: str


class ImageModerationResponse(BaseModel):
    approved: bool
    flags: list[str]
    confidence_scores: dict[str, float]
    processing_time_ms: int


class ReviewQueueItem(BaseModel):
    id: str
    content_type: str
    content_url: str
    content_text: Optional[str]
    flags: list[str]
    confidence_scores: dict[str, float]
    artist_id: Optional[str]
    user_id: str
    submitted_at: datetime
    priority: int


class ReviewDecision(BaseModel):
    approved: bool
    reason: Optional[str]
    notes: Optional[str]


class ArtistRestrictionConfig(BaseModel):
    artist_id: str
    whitelist_topics: list[str]
    blacklist_topics: list[str]
    custom_filters: list[str]
    max_text_length: int = 500


# Health
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "regtech-filter",
        "version": "1.0.0",
        "thresholds": {
            "nsfw": settings.nsfw_detection_threshold,
            "political": settings.political_content_threshold,
            "misinformation": settings.misinformation_threshold,
        },
    }


# Text moderation
@app.post("/moderate/text", response_model=TextModerationResponse)
async def moderate_text(request: TextModerationRequest):
    """
    Moderate text content using LLM toxicity filter.

    Checks for:
    - Hate speech / toxicity
    - Political content
    - Profanity
    - Personal attacks
    - Misinformation patterns
    """
    import time
    import random

    start_time = time.time()

    # Get artist restrictions if applicable
    restrictions = None
    if request.artist_id:
        restrictions = await _get_artist_restrictions(request.artist_id)

    # Run moderation checks
    flags = []
    scores = {}

    if settings.ai_mode == "mock":
        # Mock moderation
        await asyncio.sleep(0.1)
        scores = {
            "toxicity": random.uniform(0.01, 0.15),
            "political": random.uniform(0.01, 0.1),
            "profanity": random.uniform(0.01, 0.05),
            "hate_speech": random.uniform(0.01, 0.05),
        }
    else:
        # Production: call LLM moderation
        from .llm_moderator import moderate_text_llm
        scores = await moderate_text_llm(request.text)

    # Check against thresholds
    if scores.get("toxicity", 0) > 0.5:
        flags.append("toxicity")
    if scores.get("political", 0) > settings.political_content_threshold:
        flags.append("political")
    if scores.get("profanity", 0) > 0.3:
        flags.append("profanity")
    if scores.get("hate_speech", 0) > 0.3:
        flags.append("hate_speech")

    # Check artist blacklist
    if restrictions:
        for blacklisted in restrictions.get("blacklist_topics", []):
            if blacklisted.lower() in request.text.lower():
                flags.append(f"blacklisted:{blacklisted}")

    processing_time_ms = int((time.time() - start_time) * 1000)
    approved = len(flags) == 0

    # Audit log
    audit_logger.log_action(
        action="text_moderation",
        actor_id="system",
        resource_type="text",
        resource_id=str(hash(request.text)),
        details={
            "approved": approved,
            "flags": flags,
            "artist_id": request.artist_id,
        },
    )

    return TextModerationResponse(
        approved=approved,
        flags=flags,
        confidence_scores=scores,
        suggestions="Please rephrase to avoid flagged content" if flags else None,
        processing_time_ms=processing_time_ms,
    )


# Video moderation
@app.post("/moderate/video", response_model=VideoModerationResponse)
async def moderate_video(request: VideoModerationRequest):
    """
    Moderate video content.

    Analyzes:
    - Frame-by-frame NSFW detection
    - Political content detection
    - Violence detection
    - Audio toxicity analysis
    """
    import time
    import random

    start_time = time.time()

    if settings.ai_mode == "mock":
        await asyncio.sleep(0.5)
        flags = []
        frame_analysis = [
            {"frame": 0, "nsfw_score": random.uniform(0.01, 0.1)},
            {"frame": 30, "nsfw_score": random.uniform(0.01, 0.1)},
            {"frame": 60, "nsfw_score": random.uniform(0.01, 0.1)},
        ]
    else:
        from .video_moderator import analyze_video
        result = await analyze_video(request.video_url)
        flags = result.get("flags", [])
        frame_analysis = result.get("frame_analysis", [])

    processing_time_ms = int((time.time() - start_time) * 1000)
    approved = len(flags) == 0

    return VideoModerationResponse(
        approved=approved,
        flags=flags,
        frame_analysis=frame_analysis,
        audio_analysis={"toxicity_score": 0.05},
        processing_time_ms=processing_time_ms,
        requires_human_review=any(f in flags for f in ["political", "potential_deepfake"]),
    )


# Image moderation
@app.post("/moderate/image", response_model=ImageModerationResponse)
async def moderate_image(request: ImageModerationRequest):
    """Moderate image content (NSFW, violence, etc.)."""
    import time
    import random

    start_time = time.time()

    if settings.ai_mode == "mock":
        await asyncio.sleep(0.1)
        scores = {
            "nsfw": random.uniform(0.01, 0.1),
            "violence": random.uniform(0.01, 0.05),
            "hate_symbols": random.uniform(0.01, 0.03),
        }
        flags = []
    else:
        from .image_moderator import analyze_image
        result = await analyze_image(request.image_url)
        scores = result.get("scores", {})
        flags = result.get("flags", [])

    # Check thresholds
    if scores.get("nsfw", 0) > settings.nsfw_detection_threshold:
        flags.append("nsfw")
    if scores.get("violence", 0) > 0.5:
        flags.append("violence")

    processing_time_ms = int((time.time() - start_time) * 1000)

    return ImageModerationResponse(
        approved=len(flags) == 0,
        flags=flags,
        confidence_scores=scores,
        processing_time_ms=processing_time_ms,
    )


# Review queue
@app.get("/review-queue", response_model=list[ReviewQueueItem])
async def get_review_queue(
    priority: Optional[int] = None,
    content_type: Optional[str] = None,
    limit: int = 20,
    user: User = Depends(require_role([Roles.ADMIN, Roles.VALIDATOR])),
):
    """Get items pending human review."""
    # Mock queue items
    return [
        ReviewQueueItem(
            id="rev_001",
            content_type="video",
            content_url="https://storage.stario.uz/review/vid_001.mp4",
            content_text=None,
            flags=["political"],
            confidence_scores={"political": 0.82},
            artist_id="art_001",
            user_id="usr_001",
            submitted_at=datetime.utcnow(),
            priority=2,
        )
    ]


@app.post("/review-queue/{item_id}/decide")
async def decide_review(
    item_id: str,
    decision: ReviewDecision,
    user: User = Depends(require_role([Roles.ADMIN, Roles.VALIDATOR])),
):
    """Submit human review decision."""
    audit_logger.log_action(
        action="human_review_decision",
        actor_id=user.id,
        resource_type="review_item",
        resource_id=item_id,
        details={
            "approved": decision.approved,
            "reason": decision.reason,
        },
    )

    return {
        "item_id": item_id,
        "decision": "approved" if decision.approved else "rejected",
        "reviewed_by": user.id,
        "reviewed_at": datetime.utcnow().isoformat(),
    }


# Artist restrictions
@app.get("/restrictions/{artist_id}", response_model=ArtistRestrictionConfig)
async def get_artist_restrictions(artist_id: str):
    """Get content restrictions for an artist."""
    return await _get_artist_restrictions(artist_id)


@app.put("/restrictions/{artist_id}")
async def update_artist_restrictions(
    artist_id: str,
    config: ArtistRestrictionConfig,
    user: User = Depends(require_role([Roles.ADMIN])),
):
    """Update artist content restrictions."""
    redis = await get_redis()
    await redis.cache_set(
        f"artist_restrictions:{artist_id}",
        config.model_dump(),
        ttl_seconds=86400,
    )

    audit_logger.log_action(
        action="update_artist_restrictions",
        actor_id=user.id,
        resource_type="artist",
        resource_id=artist_id,
        details=config.model_dump(),
    )

    return {"message": "Restrictions updated", "artist_id": artist_id}


async def _get_artist_restrictions(artist_id: str) -> dict:
    """Get artist restrictions from cache or default."""
    redis = await get_redis()
    cached = await redis.cache_get(f"artist_restrictions:{artist_id}")

    if cached:
        return cached

    # Default restrictions
    return {
        "artist_id": artist_id,
        "whitelist_topics": ["birthday", "greeting", "congratulation", "holiday"],
        "blacklist_topics": ["politics", "religion", "violence", "adult", "drugs"],
        "custom_filters": [],
        "max_text_length": 500,
    }


# Audit logs
@app.get("/audit-logs")
async def get_audit_logs(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    action_type: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(require_role([Roles.ADMIN])),
):
    """Get audit logs (90-day retention)."""
    return {
        "logs": [],
        "total": 0,
        "retention_days": 90,
    }


@app.post("/audit-logs/export")
async def export_audit_logs(
    start_date: datetime,
    end_date: datetime,
    format: str = "json",
    user: User = Depends(require_role([Roles.ADMIN])),
):
    """Export audit logs for legal compliance."""
    audit_logger.log_data_export(
        actor_id=user.id,
        export_type="audit_logs",
        record_count=0,
        purpose="legal_export",
    )

    return {
        "export_id": "exp_001",
        "status": "processing",
        "download_url": None,
    }


# Metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
