"""
YOLO Detection API Client
Connects to YOLO API (localhost:8002) for person/face detection
"""

import httpx
from typing import Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

YOLO_API_URL = "http://localhost:8002"


@dataclass
class Detection:
    """Single detection result"""
    class_name: str
    confidence: float
    x: float
    y: float
    width: float
    height: float


@dataclass
class DetectionResult:
    """Result from YOLO API"""
    success: bool
    person_detected: bool
    detections: list[Detection]
    best_person_bbox: Optional[dict] = None
    error: Optional[str] = None


class YOLOClient:
    """Client for YOLO Detection API"""

    def __init__(self, base_url: str = YOLO_API_URL):
        self.base_url = base_url
        self.timeout = 30.0

    async def detect(self, image_bytes: bytes) -> DetectionResult:
        """
        Send image to YOLO API for detection

        Args:
            image_bytes: Raw image bytes

        Returns:
            DetectionResult with person detection info
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                files = {"file": ("image.jpg", image_bytes, "image/jpeg")}
                response = await client.post(
                    f"{self.base_url}/detect",
                    files=files
                )

                if response.status_code != 200:
                    logger.error(f"YOLO API error: {response.status_code}")
                    return DetectionResult(
                        success=False,
                        person_detected=False,
                        detections=[],
                        error=f"YOLO API returned {response.status_code}"
                    )

                data = response.json()

                # Parse detections
                detections = []
                best_person = None
                best_confidence = 0.0

                for det in data.get("detections", []):
                    detection = Detection(
                        class_name=det.get("class_name", ""),
                        confidence=det.get("confidence", 0),
                        x=det.get("x", 0),
                        y=det.get("y", 0),
                        width=det.get("width", 0),
                        height=det.get("height", 0)
                    )
                    detections.append(detection)

                    # Track best person detection
                    if detection.class_name == "person" and detection.confidence > best_confidence:
                        best_confidence = detection.confidence
                        best_person = {
                            "x": detection.x,
                            "y": detection.y,
                            "width": detection.width,
                            "height": detection.height,
                            "confidence": detection.confidence
                        }

                person_detected = best_person is not None

                logger.info(f"YOLO detection: {len(detections)} objects, person={person_detected}")

                return DetectionResult(
                    success=True,
                    person_detected=person_detected,
                    detections=detections,
                    best_person_bbox=best_person
                )

        except httpx.ConnectError:
            logger.warning("YOLO API not available, skipping detection")
            return DetectionResult(
                success=True,  # Allow to continue without YOLO
                person_detected=True,  # Assume person present
                detections=[],
                error="YOLO API not available"
            )
        except Exception as e:
            logger.error(f"YOLO detection error: {e}")
            return DetectionResult(
                success=False,
                person_detected=False,
                detections=[],
                error=str(e)
            )

    async def health_check(self) -> bool:
        """Check if YOLO API is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False


# Singleton instance
yolo_client = YOLOClient()
