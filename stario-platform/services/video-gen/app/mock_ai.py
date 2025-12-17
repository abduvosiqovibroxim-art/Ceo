"""
Mock AI video generator for development and testing.

Simulates LivePortrait/SadTalker behavior without requiring GPU.
"""

import asyncio
import random
import uuid
from datetime import datetime
from typing import Optional

from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.s3_client import get_s3

logger = get_logger(__name__)
settings = get_settings()


class MockVideoGenerator:
    """
    Mock video generator that simulates AI video generation.

    In production, this would be replaced with actual LivePortrait/SadTalker calls.
    """

    # Sample output videos for mock responses
    MOCK_VIDEOS = [
        "https://storage.stario.uz/mock/sample_video_1.mp4",
        "https://storage.stario.uz/mock/sample_video_2.mp4",
        "https://storage.stario.uz/mock/sample_video_3.mp4",
    ]

    MOCK_THUMBNAILS = [
        "https://storage.stario.uz/mock/thumb_1.jpg",
        "https://storage.stario.uz/mock/thumb_2.jpg",
        "https://storage.stario.uz/mock/thumb_3.jpg",
    ]

    async def generate(
        self,
        artist_id: str,
        message: str,
        recipient_name: str,
        occasion: str,
        duration_seconds: int = 15,
        source_image_url: Optional[str] = None,
        audio_url: Optional[str] = None,
    ) -> dict:
        """
        Generate a mock video.

        Simulates the pipeline:
        1. Text-to-Speech (message -> audio)
        2. Face Animation (source image + audio -> video)
        3. Post-processing (upscaling, filters)

        Target: <40 seconds total processing time.
        """
        logger.info(
            "Mock video generation started",
            artist_id=artist_id,
            duration=duration_seconds,
        )

        total_time = 0

        # Simulate TTS generation (5-10s)
        tts_time = random.uniform(5, 10)
        await asyncio.sleep(tts_time)
        total_time += tts_time
        logger.debug("TTS completed", time_seconds=tts_time)

        # Simulate face animation (15-25s based on duration)
        base_animation_time = 15 + (duration_seconds / 60) * 10
        animation_time = random.uniform(base_animation_time * 0.8, base_animation_time * 1.2)
        await asyncio.sleep(animation_time)
        total_time += animation_time
        logger.debug("Face animation completed", time_seconds=animation_time)

        # Simulate post-processing (3-5s)
        post_time = random.uniform(3, 5)
        await asyncio.sleep(post_time)
        total_time += post_time
        logger.debug("Post-processing completed", time_seconds=post_time)

        # Generate mock output
        video_id = str(uuid.uuid4())

        result = {
            "video_id": video_id,
            "video_url": random.choice(self.MOCK_VIDEOS),
            "thumbnail_url": random.choice(self.MOCK_THUMBNAILS),
            "duration_seconds": duration_seconds,
            "processing_time_seconds": total_time,
            "metadata": {
                "artist_id": artist_id,
                "recipient_name": recipient_name,
                "occasion": occasion,
                "message_length": len(message),
                "ai_model": "mock",
                "generated_at": datetime.utcnow().isoformat(),
            },
        }

        logger.info(
            "Mock video generation completed",
            video_id=video_id,
            total_time_seconds=total_time,
        )

        return result

    async def check_health(self) -> dict:
        """Check mock AI service health."""
        return {
            "status": "healthy",
            "mode": "mock",
            "gpu_available": False,
            "models_loaded": ["mock_liveportrait", "mock_sadtalker", "mock_tts"],
        }


class MockTTSGenerator:
    """Mock Text-to-Speech generator."""

    async def generate(
        self,
        text: str,
        voice_id: str,
        language: str = "uz",
        emotion: str = "neutral",
        speed: float = 1.0,
    ) -> dict:
        """Generate mock audio from text."""
        # Estimate duration (rough: 150 words per minute)
        word_count = len(text.split())
        duration_seconds = (word_count / 150) * 60 / speed

        await asyncio.sleep(random.uniform(2, 5))

        return {
            "audio_url": "https://storage.stario.uz/mock/tts_output.mp3",
            "duration_seconds": duration_seconds,
            "voice_id": voice_id,
            "language": language,
        }


class MockFaceAnimator:
    """Mock face animation generator (LivePortrait/SadTalker)."""

    async def animate(
        self,
        source_image_url: str,
        driving_audio_url: str,
        style: str = "natural",
    ) -> dict:
        """Animate a face image with audio."""
        await asyncio.sleep(random.uniform(15, 25))

        return {
            "video_url": "https://storage.stario.uz/mock/animated.mp4",
            "frame_count": 450,
            "fps": 30,
            "style": style,
        }


# GPU Pipeline simulator
class MockGPUPipeline:
    """Simulates GPU processing pipeline."""

    def __init__(self):
        self._queue_size = 0
        self._max_concurrent = 4

    async def submit(self, task_type: str, params: dict) -> str:
        """Submit a task to the GPU pipeline."""
        task_id = str(uuid.uuid4())
        self._queue_size += 1

        logger.info(
            "GPU task submitted",
            task_id=task_id,
            task_type=task_type,
            queue_size=self._queue_size,
        )

        return task_id

    async def wait(self, task_id: str, timeout: int = 120) -> dict:
        """Wait for a GPU task to complete."""
        # Simulate processing time
        await asyncio.sleep(random.uniform(10, 30))
        self._queue_size = max(0, self._queue_size - 1)

        return {
            "task_id": task_id,
            "status": "completed",
            "output_url": "https://storage.stario.uz/mock/output.mp4",
        }

    def get_stats(self) -> dict:
        """Get pipeline statistics."""
        return {
            "queue_size": self._queue_size,
            "max_concurrent": self._max_concurrent,
            "gpu_utilization": random.uniform(0.3, 0.9),
            "memory_used_gb": random.uniform(8, 20),
        }
