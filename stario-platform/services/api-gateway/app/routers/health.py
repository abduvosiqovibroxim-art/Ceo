"""Health check endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from stario_common.database import get_db
from stario_common.redis_client import get_redis

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    checks: dict[str, dict]


class ReadinessResponse(BaseModel):
    ready: bool
    checks: dict[str, bool]


@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse)
async def health_check():
    """Basic health check."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
        version="1.0.0",
        checks={
            "api": {"status": "up"},
        },
    )


@router.get("/ready", response_model=ReadinessResponse)
async def readiness_check():
    """Readiness check - verifies all dependencies are available."""
    checks = {}

    # Check database
    try:
        db = get_db()
        async with db.session() as session:
            await session.execute("SELECT 1")
        checks["database"] = True
    except Exception:
        checks["database"] = False

    # Check Redis
    try:
        redis = await get_redis()
        await redis.client.ping()
        checks["redis"] = True
    except Exception:
        checks["redis"] = False

    ready = all(checks.values())
    return ReadinessResponse(ready=ready, checks=checks)


@router.get("/live")
async def liveness_check():
    """Liveness check - simple ping."""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat() + "Z"}
