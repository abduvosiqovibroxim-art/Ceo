"""
Stario Common Library - Shared utilities for all Python microservices.
"""

__version__ = "1.0.0"

from .config import Settings, get_settings
from .database import Database, get_db
from .redis_client import RedisClient, get_redis
from .s3_client import S3Client, get_s3
from .auth import verify_token, create_access_token, get_current_user
from .models import BaseModel, TimestampMixin
from .exceptions import (
    StarioException,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    ServiceUnavailableError,
)
from .logging import setup_logging, get_logger
from .metrics import metrics, track_request

__all__ = [
    "Settings",
    "get_settings",
    "Database",
    "get_db",
    "RedisClient",
    "get_redis",
    "S3Client",
    "get_s3",
    "verify_token",
    "create_access_token",
    "get_current_user",
    "BaseModel",
    "TimestampMixin",
    "StarioException",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "ServiceUnavailableError",
    "setup_logging",
    "get_logger",
    "metrics",
    "track_request",
]
