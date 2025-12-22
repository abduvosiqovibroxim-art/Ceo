"""Configuration for AI Poster Maker API."""

from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""

    # Paths
    base_dir: Path = Path(__file__).parent.parent
    # Use face-quiz celebrities (they have quality photos)
    celebrities_path: str = "../face-quiz/backend/data/celebrities"
    templates_path: str = "data/templates"
    temp_dir: str = "temp"

    # InsightFace settings
    face_model_name: str = "buffalo_l"
    face_swap_model: str = "inswapper_128.onnx"

    # API settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = [".jpg", ".jpeg", ".png", ".webp"]

    # Generation settings
    output_quality: int = 95
    output_format: str = "JPEG"
    max_image_size: int = 1024

    class Config:
        env_file = ".env"
        env_prefix = "POSTER_"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
