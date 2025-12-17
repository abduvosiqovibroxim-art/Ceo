"""Voice generation and Voice Quiz endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from stario_common.auth import User, get_current_user
from stario_common.models import JobStatus
from stario_common.redis_client import get_redis

router = APIRouter()


class VoiceGenerationRequest(BaseModel):
    artist_id: str
    text: str
    language: str = "uz"
    emotion: str = "neutral"  # neutral, happy, sad, excited
    speed: float = 1.0  # 0.5 to 2.0


class VoiceGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_seconds: int


class VoiceJobStatus(BaseModel):
    job_id: str
    status: str
    progress_percent: int
    audio_url: Optional[str]
    duration_seconds: Optional[float]
    error_message: Optional[str]


class VoiceQuizRequest(BaseModel):
    artist_id: str


class VoiceQuizResponse(BaseModel):
    quiz_id: str
    artist_id: str
    sample_audio_url: str
    options: list[dict]  # [{"id": "opt_1", "audio_url": "...", "label": "A"}]


class VoiceQuizAnswer(BaseModel):
    quiz_id: str
    selected_option_id: str


class VoiceQuizResult(BaseModel):
    quiz_id: str
    is_correct: bool
    correct_option_id: str
    artist_id: str
    score: int
    total_attempts: int


@router.post("/generate", response_model=VoiceGenerationResponse)
async def generate_voice(
    request: VoiceGenerationRequest,
    user: User = Depends(get_current_user),
):
    """
    Generate AI voice message from artist.

    Uses RVC/FastSpeech2 for voice synthesis.
    """
    import uuid

    job_id = str(uuid.uuid4())

    redis = await get_redis()
    await redis.enqueue(
        "voice_generation",
        {
            "job_id": job_id,
            "user_id": user.id,
            "artist_id": request.artist_id,
            "text": request.text,
            "language": request.language,
            "emotion": request.emotion,
            "speed": request.speed,
        },
    )

    return VoiceGenerationResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        estimated_duration_seconds=10,
    )


@router.get("/jobs/{job_id}", response_model=VoiceJobStatus)
async def get_voice_job_status(
    job_id: str,
    user: User = Depends(get_current_user),
):
    """Get voice generation job status."""
    redis = await get_redis()
    job = await redis.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return VoiceJobStatus(
        job_id=job_id,
        status=job.get("status", JobStatus.PENDING),
        progress_percent=job.get("progress", 0),
        audio_url=job.get("result", {}).get("audio_url"),
        duration_seconds=job.get("result", {}).get("duration_seconds"),
        error_message=job.get("error"),
    )


@router.post("/quiz/start", response_model=VoiceQuizResponse)
async def start_voice_quiz(
    request: VoiceQuizRequest,
    user: User = Depends(get_current_user),
):
    """
    Start Voice Quiz - guess which voice is real vs AI.

    The quiz presents audio samples and user must identify
    the real artist voice vs AI-generated voices.
    """
    import uuid

    quiz_id = str(uuid.uuid4())

    return VoiceQuizResponse(
        quiz_id=quiz_id,
        artist_id=request.artist_id,
        sample_audio_url="https://storage.stario.uz/quiz/sample.mp3",
        options=[
            {
                "id": "opt_1",
                "audio_url": "https://storage.stario.uz/quiz/opt_1.mp3",
                "label": "A",
            },
            {
                "id": "opt_2",
                "audio_url": "https://storage.stario.uz/quiz/opt_2.mp3",
                "label": "B",
            },
            {
                "id": "opt_3",
                "audio_url": "https://storage.stario.uz/quiz/opt_3.mp3",
                "label": "C",
            },
        ],
    )


@router.post("/quiz/answer", response_model=VoiceQuizResult)
async def submit_voice_quiz_answer(
    answer: VoiceQuizAnswer,
    user: User = Depends(get_current_user),
):
    """Submit answer for Voice Quiz."""
    # In production, verify the answer against stored quiz data
    is_correct = answer.selected_option_id == "opt_2"  # Mock correct answer

    return VoiceQuizResult(
        quiz_id=answer.quiz_id,
        is_correct=is_correct,
        correct_option_id="opt_2",
        artist_id="art_001",
        score=100 if is_correct else 0,
        total_attempts=1,
    )


@router.get("/quiz/leaderboard")
async def get_voice_quiz_leaderboard(
    artist_id: Optional[str] = None,
    period: str = "weekly",  # daily, weekly, monthly, all_time
):
    """Get Voice Quiz leaderboard."""
    return {
        "period": period,
        "artist_id": artist_id,
        "leaderboard": [
            {"rank": 1, "user_id": "usr_001", "username": "champion", "score": 9500},
            {"rank": 2, "user_id": "usr_002", "username": "voicemaster", "score": 8700},
            {"rank": 3, "user_id": "usr_003", "username": "listener", "score": 8200},
        ],
    }


@router.get("/artists/{artist_id}/samples")
async def get_artist_voice_samples(
    artist_id: str,
    user: User = Depends(get_current_user),
):
    """Get artist voice samples for preview."""
    return {
        "artist_id": artist_id,
        "samples": [
            {
                "id": "smp_001",
                "audio_url": "https://storage.stario.uz/samples/greeting.mp3",
                "text": "Salom! Xush kelibsiz!",
                "emotion": "happy",
            },
            {
                "id": "smp_002",
                "audio_url": "https://storage.stario.uz/samples/birthday.mp3",
                "text": "Tug'ilgan kuning bilan!",
                "emotion": "excited",
            },
        ],
    }
