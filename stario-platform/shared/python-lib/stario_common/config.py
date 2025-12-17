"""
Configuration management using Pydantic Settings.
"""

from functools import lru_cache
from typing import Literal, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Core
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql://stario:stario@localhost:5432/stario"
    database_pool_size: int = 20
    database_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_queue_db: int = 1
    redis_cache_db: int = 2

    # S3
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket_uploads: str = "stario-uploads"
    s3_bucket_generated: str = "stario-generated"
    s3_bucket_assets: str = "stario-assets"
    s3_region: str = "us-east-1"

    # Authentication
    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    encryption_key: str = Field(default="change-me-32-bytes-key-here!!!")

    # OAuth2
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    telegram_bot_token: Optional[str] = None

    # AI Services
    ai_mode: Literal["mock", "production"] = "mock"
    liveportrait_endpoint: str = "http://localhost:8100"
    sadtalker_endpoint: str = "http://localhost:8101"
    rvc_endpoint: str = "http://localhost:8102"
    fastspeech2_endpoint: str = "http://localhost:8103"
    insightface_endpoint: str = "http://localhost:8104"
    sdxl_endpoint: str = "http://localhost:8105"
    gpu_queue_timeout: int = 120
    gpu_max_concurrent_jobs: int = 4

    # Payments
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    payme_merchant_id: Optional[str] = None
    payme_secret_key: Optional[str] = None
    payme_test_mode: bool = True
    click_service_id: Optional[str] = None
    click_merchant_id: Optional[str] = None
    click_secret_key: Optional[str] = None
    click_test_mode: bool = True

    # External Services
    telegram_miniapp_url: str = "https://t.me/stario_bot/app"
    boxnow_api_url: str = "https://api.boxnow.uz"
    boxnow_api_key: Optional[str] = None
    logistics_mode: Literal["mock", "production"] = "mock"

    # Moderation
    moderation_llm_endpoint: str = "http://localhost:8200"
    moderation_llm_model: str = "gpt-4"
    openai_api_key: Optional[str] = None
    nsfw_detection_threshold: float = 0.7
    political_content_threshold: float = 0.8
    misinformation_threshold: float = 0.75
    audit_log_retention_days: int = 90

    # Observability
    prometheus_enabled: bool = True
    prometheus_port: int = 9090
    sentry_dsn: Optional[str] = None
    sentry_environment: str = "development"
    amplitude_api_key: Optional[str] = None
    mixpanel_token: Optional[str] = None
    firebase_project_id: Optional[str] = None

    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    rate_limit_requests_per_day: int = 10000
    rate_limit_burst: int = 10

    # File Upload
    max_upload_size_mb: int = 50
    allowed_image_types: str = "image/jpeg,image/png,image/webp"
    allowed_video_types: str = "video/mp4,video/webm"
    allowed_audio_types: str = "audio/mp3,audio/wav,audio/ogg"
    ephemeral_upload_ttl_seconds: int = 3

    # Performance Targets
    video_gen_target_latency_ms: int = 40000
    poster_gen_target_latency_ms: int = 5000
    face_similarity_target_latency_ms: int = 200
    worker_concurrency: int = 4
    max_queue_size: int = 1000

    # Compliance
    data_residency_region: str = "uz"
    pii_auto_delete_days: int = 30
    legal_export_enabled: bool = True
    artist_verification_required: bool = True

    @field_validator("allowed_image_types", "allowed_video_types", "allowed_audio_types")
    @classmethod
    def split_comma_list(cls, v: str) -> list[str]:
        if isinstance(v, str):
            return [x.strip() for x in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
