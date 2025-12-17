from pydantic import BaseModel, Field
from typing import List


class BoundingBox(BaseModel):
    x1: float = Field(..., description="Left coordinate")
    y1: float = Field(..., description="Top coordinate")
    x2: float = Field(..., description="Right coordinate")
    y2: float = Field(..., description="Bottom coordinate")


class Detection(BaseModel):
    class_id: int = Field(..., description="Class ID")
    class_name: str = Field(..., description="Class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    bbox: BoundingBox = Field(..., description="Bounding box in xyxy format")


class DetectionResponse(BaseModel):
    detections: List[Detection] = Field(default_factory=list, description="List of detected objects")
    count: int = Field(..., description="Total number of detections")
    image_width: int = Field(..., description="Original image width")
    image_height: int = Field(..., description="Original image height")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    model_path: str
