"""Pydantic models for AI Poster Maker API."""

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class SceneType(str, Enum):
    HUG = "hug"
    RED_CARPET = "red_carpet"
    MOVIE_POSTER = "movie_poster"
    SELFIE = "selfie"
    WEDDING = "wedding"
    CONCERT = "concert"


class CelebrityCategory(str, Enum):
    UZBEK = "uzbek"
    HOLLYWOOD = "hollywood"
    KPOP = "kpop"
    BOLLYWOOD = "bollywood"


class Celebrity(BaseModel):
    id: str
    name: str
    name_uz: str
    image: str
    category: CelebrityCategory
    photos_count: int = 1


class Template(BaseModel):
    id: str
    name: str
    name_uz: str
    scene_type: SceneType
    preview: str
    description: str


class FaceUploadResponse(BaseModel):
    face_id: str
    preview_url: str
    face_detected: bool
    face_quality: str  # low, medium, high
    message: Optional[str] = None


class GenerateRequest(BaseModel):
    face_id: str
    celebrity_id: str
    template_id: str


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerateResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = 0
    stage: Optional[str] = None
    result_url: Optional[str] = None
    error: Optional[str] = None


class CelebritiesResponse(BaseModel):
    celebrities: List[Celebrity]
    total: int


class TemplatesResponse(BaseModel):
    templates: List[Template]
    total: int


class HealthResponse(BaseModel):
    status: str
    celebrities_count: int
    templates_count: int
    face_swap_ready: bool
