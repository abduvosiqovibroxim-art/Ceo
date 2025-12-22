from pydantic_settings import BaseSettings
from functools import lru_cache
import torch


class Settings(BaseSettings):
    model_path: str = "yolov8n.pt"
    confidence_threshold: float = 0.5  # Increased from 0.25 for better accuracy
    iou_threshold: float = 0.5  # Slightly increased for better filtering
    max_detections: int = 100  # Reduced from 300 for better performance
    device: str = "cuda" if torch.cuda.is_available() else "cpu"

    class Config:
        env_file = ".env"
        env_prefix = "YOLO_"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
