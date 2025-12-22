"""Configuration for Face Quiz API."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # DeepFace settings
    model_name: str = "VGG-Face"  # VGG-Face, Facenet, OpenFace, DeepFace, ArcFace
    detector_backend: str = "opencv"  # opencv, ssd, dlib, mtcnn, retinaface
    enforce_detection: bool = False

    # API settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    temp_dir: str = "temp"  # Relative to working directory

    # Celebrities data
    celebrities_path: str = "data/celebrities"

    class Config:
        env_file = ".env"
        env_prefix = "FACE_QUIZ_"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
