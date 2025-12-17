"""
InsightFace client for production face recognition.
"""

import httpx

from stario_common.config import get_settings
from stario_common.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


async def compare_faces_insightface(
    image1_url: str,
    image2_url: str,
) -> dict:
    """
    Compare two faces using InsightFace.

    Returns similarity score between 0 and 1.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.insightface_endpoint}/compare",
            json={
                "image1": image1_url,
                "image2": image2_url,
            },
        )
        response.raise_for_status()
        return response.json()


async def detect_faces_insightface(image_url: str) -> list[dict]:
    """
    Detect faces in an image using InsightFace.

    Returns list of detected faces with bounding boxes and landmarks.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.insightface_endpoint}/detect",
            json={"image": image_url},
        )
        response.raise_for_status()
        return response.json().get("faces", [])


async def get_embedding_insightface(image_url: str) -> list[float]:
    """
    Get face embedding vector using InsightFace.

    Returns 512-dimensional embedding vector.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.insightface_endpoint}/embed",
            json={"image": image_url},
        )
        response.raise_for_status()
        return response.json().get("embedding", [])


async def analyze_face_features(image_url: str) -> dict:
    """
    Analyze facial features using InsightFace.

    Returns detailed feature analysis.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.insightface_endpoint}/analyze",
            json={"image": image_url},
        )
        response.raise_for_status()
        return response.json()
