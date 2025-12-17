"""
Stario API Gateway - FastAPI Application
"""

import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app

from stario_common.config import get_settings
from stario_common.database import get_db
from stario_common.exceptions import StarioException
from stario_common.logging import get_logger, setup_logging
from stario_common.metrics import get_metrics
from stario_common.redis_client import get_redis

from .routers import (
    artists,
    auth,
    content,
    face_quiz,
    health,
    merch,
    orders,
    payments,
    posters,
    users,
    videos,
    voice,
)

setup_logging("api-gateway")
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    logger.info("Starting API Gateway", version="1.0.0", environment=settings.environment)

    # Initialize connections
    await get_redis()
    db = get_db()
    await db.create_tables()

    # Initialize metrics
    get_metrics("api-gateway")

    yield

    # Cleanup
    redis = await get_redis()
    await redis.close()
    await db.close()
    logger.info("API Gateway shutdown complete")


app = FastAPI(
    title="Stario API Gateway",
    description="AI Emotion Platform - Create personalized video greetings with your favorite artists",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://stario.uz",
        "https://app.stario.uz",
        "https://admin.stario.uz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    # Track metrics
    metrics = get_metrics()
    metrics.track_request(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code,
        duration=duration,
    )

    # Add timing header
    response.headers["X-Response-Time"] = f"{duration:.3f}s"
    return response


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/health") or request.url.path.startswith("/metrics"):
        return await call_next(request)

    # Get client identifier
    client_ip = request.client.host if request.client else "unknown"
    user_id = getattr(request.state, "user_id", None)
    client_key = f"rate_limit:{user_id or client_ip}"

    # Check rate limit
    redis = await get_redis()
    allowed, remaining = await redis.check_rate_limit(
        client_key,
        max_requests=settings.rate_limit_requests_per_minute,
        window_seconds=60,
    )

    if not allowed:
        return JSONResponse(
            status_code=429,
            content={
                "error": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
                "retry_after_seconds": 60,
            },
            headers={"Retry-After": "60"},
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response


# Exception handlers
@app.exception_handler(StarioException)
async def stario_exception_handler(request: Request, exc: StarioException):
    logger.error(
        "stario_error",
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request_id=getattr(request.state, "request_id", None),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_error",
        error=str(exc),
        request_id=getattr(request.state, "request_id", None),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
        },
    )


# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(artists.router, prefix="/artists", tags=["Artists"])
app.include_router(videos.router, prefix="/videos", tags=["Video Generation"])
app.include_router(voice.router, prefix="/voice", tags=["Voice Generation"])
app.include_router(face_quiz.router, prefix="/face-quiz", tags=["Face Quiz"])
app.include_router(posters.router, prefix="/posters", tags=["Poster Generation"])
app.include_router(merch.router, prefix="/merch", tags=["Merchandise"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(content.router, prefix="/content", tags=["Content Moderation"])


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Stario API Gateway",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else None,
    }
