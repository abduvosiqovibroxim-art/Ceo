"""
Redis client for caching and job queues.
"""

import json
from typing import Any, Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from .config import get_settings


class RedisClient:
    """Redis client wrapper with caching and queue support."""

    def __init__(self, url: Optional[str] = None):
        settings = get_settings()
        self._url = url or settings.redis_url
        self._client: Optional[Redis] = None
        self._cache_client: Optional[Redis] = None
        self._queue_client: Optional[Redis] = None

    async def connect(self) -> None:
        """Connect to Redis."""
        settings = get_settings()
        self._client = await redis.from_url(self._url, decode_responses=True)

        # Separate connections for cache and queue
        cache_url = self._url.rsplit("/", 1)[0] + f"/{settings.redis_cache_db}"
        queue_url = self._url.rsplit("/", 1)[0] + f"/{settings.redis_queue_db}"

        self._cache_client = await redis.from_url(cache_url, decode_responses=True)
        self._queue_client = await redis.from_url(queue_url, decode_responses=True)

    async def close(self) -> None:
        """Close Redis connections."""
        if self._client:
            await self._client.close()
        if self._cache_client:
            await self._cache_client.close()
        if self._queue_client:
            await self._queue_client.close()

    @property
    def client(self) -> Redis:
        """Get the main Redis client."""
        if not self._client:
            raise RuntimeError("Redis not connected. Call connect() first.")
        return self._client

    # Cache operations
    async def cache_get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        if not self._cache_client:
            raise RuntimeError("Redis not connected")
        value = await self._cache_client.get(key)
        if value:
            return json.loads(value)
        return None

    async def cache_set(
        self, key: str, value: Any, ttl_seconds: int = 3600
    ) -> None:
        """Set a value in cache with TTL."""
        if not self._cache_client:
            raise RuntimeError("Redis not connected")
        await self._cache_client.setex(
            key, ttl_seconds, json.dumps(value, default=str)
        )

    async def cache_delete(self, key: str) -> None:
        """Delete a key from cache."""
        if not self._cache_client:
            raise RuntimeError("Redis not connected")
        await self._cache_client.delete(key)

    async def cache_exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        if not self._cache_client:
            raise RuntimeError("Redis not connected")
        return bool(await self._cache_client.exists(key))

    # Queue operations
    async def enqueue(self, queue_name: str, job_data: dict) -> str:
        """Add a job to a queue."""
        if not self._queue_client:
            raise RuntimeError("Redis not connected")

        import uuid
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "status": "pending",
            "data": job_data,
        }
        await self._queue_client.lpush(queue_name, json.dumps(job))
        await self._queue_client.set(f"job:{job_id}", json.dumps(job))
        return job_id

    async def dequeue(self, queue_name: str, timeout: int = 0) -> Optional[dict]:
        """Get a job from a queue (blocking)."""
        if not self._queue_client:
            raise RuntimeError("Redis not connected")

        result = await self._queue_client.brpop(queue_name, timeout=timeout)
        if result:
            _, job_data = result
            return json.loads(job_data)
        return None

    async def get_job(self, job_id: str) -> Optional[dict]:
        """Get job status by ID."""
        if not self._queue_client:
            raise RuntimeError("Redis not connected")

        job_data = await self._queue_client.get(f"job:{job_id}")
        if job_data:
            return json.loads(job_data)
        return None

    async def update_job(self, job_id: str, status: str, result: Any = None) -> None:
        """Update job status."""
        if not self._queue_client:
            raise RuntimeError("Redis not connected")

        job_data = await self.get_job(job_id)
        if job_data:
            job_data["status"] = status
            if result is not None:
                job_data["result"] = result
            await self._queue_client.set(f"job:{job_id}", json.dumps(job_data, default=str))

    # Rate limiting
    async def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int
    ) -> tuple[bool, int]:
        """Check if rate limit is exceeded. Returns (allowed, remaining)."""
        if not self._client:
            raise RuntimeError("Redis not connected")

        current = await self._client.incr(key)
        if current == 1:
            await self._client.expire(key, window_seconds)

        remaining = max(0, max_requests - current)
        allowed = current <= max_requests
        return allowed, remaining

    # Pub/Sub
    async def publish(self, channel: str, message: Any) -> None:
        """Publish a message to a channel."""
        if not self._client:
            raise RuntimeError("Redis not connected")
        await self._client.publish(channel, json.dumps(message, default=str))


# Global Redis instance
_redis: Optional[RedisClient] = None


async def get_redis() -> RedisClient:
    """Get the global Redis instance."""
    global _redis
    if _redis is None:
        _redis = RedisClient()
        await _redis.connect()
    return _redis
