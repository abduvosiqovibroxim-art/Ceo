"""
Video generation worker - processes jobs from Redis queue.
"""

import asyncio
import time
from datetime import datetime
from typing import Optional

from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.metrics import get_metrics
from stario_common.redis_client import get_redis
from stario_common.s3_client import get_s3

from .mock_ai import MockVideoGenerator

logger = get_logger(__name__)
settings = get_settings()


class VideoGenerationWorker:
    """Worker that processes video generation jobs from queue."""

    def __init__(self):
        self._running = False
        self._current_jobs = 0
        self._max_concurrent = settings.gpu_max_concurrent_jobs

    async def start(self) -> None:
        """Start the worker."""
        self._running = True
        logger.info("Video generation worker started", max_concurrent=self._max_concurrent)

        while self._running:
            try:
                await self._process_queue()
            except Exception as e:
                logger.error("Worker error", error=str(e))
                await asyncio.sleep(1)

    async def stop(self) -> None:
        """Stop the worker."""
        self._running = False
        logger.info("Video generation worker stopped")

    async def _process_queue(self) -> None:
        """Process jobs from the queue."""
        if self._current_jobs >= self._max_concurrent:
            await asyncio.sleep(0.5)
            return

        redis = await get_redis()

        # Try to get a job from queue
        job = await redis.dequeue("video_generation", timeout=1)
        if not job:
            return

        job_id = job["data"].get("job_id")
        logger.info("Processing video job", job_id=job_id)

        self._current_jobs += 1
        try:
            await self._process_job(job["data"])
        finally:
            self._current_jobs -= 1

    async def _process_job(self, job_data: dict) -> None:
        """Process a single video generation job."""
        job_id = job_data.get("job_id")
        redis = await get_redis()
        metrics = get_metrics()

        start_time = time.time()

        try:
            # Update status to processing
            await redis.update_job(job_id, "processing")

            # Initialize generator based on AI mode
            if settings.ai_mode == "mock":
                generator = MockVideoGenerator()
            else:
                from .ai_client import AIVideoGenerator
                generator = AIVideoGenerator()

            # Generate video
            result = await generator.generate(
                artist_id=job_data.get("artist_id"),
                message=job_data.get("custom_message", ""),
                recipient_name=job_data.get("recipient_name", ""),
                occasion=job_data.get("occasion", "greeting"),
                duration_seconds=job_data.get("duration_seconds", 15),
            )

            processing_time_ms = int((time.time() - start_time) * 1000)

            # Update job with result
            await redis.update_job(
                job_id,
                "completed",
                result={
                    "video_url": result["video_url"],
                    "thumbnail_url": result["thumbnail_url"],
                    "duration_seconds": result["duration_seconds"],
                    "processing_time_ms": processing_time_ms,
                },
            )

            # Track metrics
            metrics.track_ai_job("video_generation", "success", processing_time_ms / 1000)

            logger.info(
                "Video generation completed",
                job_id=job_id,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            processing_time_ms = int((time.time() - start_time) * 1000)

            await redis.update_job(job_id, "failed", result={"error": str(e)})
            metrics.track_ai_job("video_generation", "error", processing_time_ms / 1000)

            logger.error(
                "Video generation failed",
                job_id=job_id,
                error=str(e),
            )
