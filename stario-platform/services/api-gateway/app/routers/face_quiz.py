"""Face Quiz and Face Similarity endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user, get_current_user_optional
from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.s3_client import get_s3

router = APIRouter()
logger = get_logger(__name__)


class FaceQuizRequest(BaseModel):
    artist_id: str
    save_photo: bool = False  # If False, photo deleted after 3s per PII rules


class FaceQuizResponse(BaseModel):
    quiz_id: str
    upload_url: str  # Presigned URL for direct upload
    upload_key: str
    expires_in_seconds: int


class FaceSimilarityResult(BaseModel):
    quiz_id: str
    artist_id: str
    similarity_score: float  # 0.0 to 100.0
    matching_features: list[str]  # ["eyes", "nose", "face_shape"]
    rank_percentile: float  # Your score vs others
    badge_earned: Optional[str]  # "Twin", "Lookalike", "Similar", etc.
    share_image_url: str


class FaceQuizLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    similarity_score: float
    avatar_url: Optional[str]


@router.post("/start", response_model=FaceQuizResponse)
async def start_face_quiz(
    request: FaceQuizRequest,
    user: User = Depends(get_current_user),
):
    """
    Start Face Quiz - Compare your face with an artist.

    Returns a presigned URL for direct photo upload.
    Photo is processed ephemerally (deleted after 3s) unless user opts in.
    """
    import uuid

    settings = get_settings()
    s3 = get_s3()

    quiz_id = str(uuid.uuid4())
    upload_key = f"face-quiz/{quiz_id}/photo.jpg"

    # Generate presigned upload URL
    upload_data = s3.get_upload_presigned_url(
        bucket=settings.s3_bucket_uploads,
        key=upload_key,
        content_type="image/jpeg",
        expires_in=300,  # 5 minutes
    )

    logger.info(
        "face_quiz_started",
        quiz_id=quiz_id,
        user_id=user.id,
        artist_id=request.artist_id,
        ephemeral=not request.save_photo,
    )

    return FaceQuizResponse(
        quiz_id=quiz_id,
        upload_url=upload_data["upload_url"],
        upload_key=upload_key,
        expires_in_seconds=300,
    )


@router.post("/{quiz_id}/analyze", response_model=FaceSimilarityResult)
async def analyze_face(
    quiz_id: str,
    user: User = Depends(get_current_user),
):
    """
    Analyze uploaded face photo.

    Processing target: <200ms per requirements.
    """
    import asyncio
    import random

    # Simulate AI processing (mock)
    # In production, call face-similarity service
    await asyncio.sleep(0.15)  # Mock ~150ms latency

    # Generate mock results
    similarity_score = random.uniform(45, 85)

    # Determine badge
    if similarity_score >= 80:
        badge = "Twin"
    elif similarity_score >= 70:
        badge = "Lookalike"
    elif similarity_score >= 60:
        badge = "Similar"
    else:
        badge = None

    result = FaceSimilarityResult(
        quiz_id=quiz_id,
        artist_id="art_001",
        similarity_score=round(similarity_score, 1),
        matching_features=["eyes", "face_shape"],
        rank_percentile=round(random.uniform(60, 95), 1),
        badge_earned=badge,
        share_image_url=f"https://storage.stario.uz/share/{quiz_id}.jpg",
    )

    logger.info(
        "face_quiz_completed",
        quiz_id=quiz_id,
        user_id=user.id,
        similarity_score=result.similarity_score,
    )

    return result


@router.get("/leaderboard", response_model=list[FaceQuizLeaderboardEntry])
async def get_face_quiz_leaderboard(
    artist_id: str,
    period: str = "weekly",  # daily, weekly, monthly, all_time
    limit: int = 10,
):
    """Get Face Quiz leaderboard for an artist."""
    return [
        FaceQuizLeaderboardEntry(
            rank=1,
            user_id="usr_001",
            username="facemaster",
            similarity_score=89.5,
            avatar_url="https://storage.stario.uz/avatars/usr_001.jpg",
        ),
        FaceQuizLeaderboardEntry(
            rank=2,
            user_id="usr_002",
            username="twinseeker",
            similarity_score=87.2,
            avatar_url=None,
        ),
        FaceQuizLeaderboardEntry(
            rank=3,
            user_id="usr_003",
            username="lookalike",
            similarity_score=85.8,
            avatar_url="https://storage.stario.uz/avatars/usr_003.jpg",
        ),
    ]


@router.get("/my-results", response_model=list[FaceSimilarityResult])
async def get_my_results(
    user: User = Depends(get_current_user),
    limit: int = 10,
):
    """Get user's Face Quiz history."""
    return [
        FaceSimilarityResult(
            quiz_id="quiz_001",
            artist_id="art_001",
            similarity_score=72.5,
            matching_features=["eyes", "nose"],
            rank_percentile=78.3,
            badge_earned="Lookalike",
            share_image_url="https://storage.stario.uz/share/quiz_001.jpg",
        )
    ]


@router.post("/{quiz_id}/share")
async def get_share_data(
    quiz_id: str,
    platform: str = "telegram",
    user: User = Depends(get_current_user),
):
    """Get shareable link and image for Face Quiz result."""
    base_url = "https://app.stario.uz/face-quiz/result"

    return {
        "share_url": f"{base_url}/{quiz_id}",
        "share_image_url": f"https://storage.stario.uz/share/{quiz_id}.jpg",
        "share_text": "I just took the Face Quiz on Stario! Check out my similarity score!",
        "telegram_share_url": f"https://t.me/share/url?url={base_url}/{quiz_id}",
    }


@router.delete("/{quiz_id}/photo")
async def delete_quiz_photo(
    quiz_id: str,
    user: User = Depends(get_current_user),
):
    """Manually delete Face Quiz photo (PII compliance)."""
    settings = get_settings()
    s3 = get_s3()

    upload_key = f"face-quiz/{quiz_id}/photo.jpg"
    s3.delete_file(settings.s3_bucket_uploads, upload_key)

    logger.info("face_quiz_photo_deleted", quiz_id=quiz_id, user_id=user.id)

    return {"message": "Photo deleted", "quiz_id": quiz_id}
