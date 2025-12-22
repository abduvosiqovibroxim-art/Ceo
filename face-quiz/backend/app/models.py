"""Pydantic models for Face Quiz API."""

from pydantic import BaseModel
from typing import List, Optional


class CelebrityMatch(BaseModel):
    """A single celebrity match result."""
    name: str
    percentage: float
    photo_path: Optional[str] = None


class CompareResponse(BaseModel):
    """Response from face comparison endpoint."""
    matches: List[CelebrityMatch]
    processing_time_ms: float
    face_detected: bool


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    celebrities_count: int
    total_photos: int
