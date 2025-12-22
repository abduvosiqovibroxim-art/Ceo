"""Face comparison service using DeepFace."""

import os
import time
import logging
from pathlib import Path
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

from deepface import DeepFace
from fastapi import UploadFile

from app.config import get_settings
from app.models import CelebrityMatch, CompareResponse


logger = logging.getLogger(__name__)


class FaceService:
    """Service for comparing faces with celebrity database."""

    def __init__(self):
        self.settings = get_settings()
        self.celebrities_path = Path(self.settings.celebrities_path)
        self.celebrities: Dict[str, List[Path]] = {}
        self.celebrities_count = 0
        self.total_photos = 0

        # Ensure temp directory exists
        os.makedirs(self.settings.temp_dir, exist_ok=True)

        # Load celebrities
        self.load_celebrities()
        logger.info(
            f"FaceService initialized with {self.celebrities_count} celebrities "
            f"and {self.total_photos} photos"
        )

    def load_celebrities(self):
        """Load all celebrity photos from the data directory."""
        self.celebrities = {}
        self.total_photos = 0

        if not self.celebrities_path.exists():
            logger.warning(f"Celebrities path not found: {self.celebrities_path}")
            return

        for celeb_dir in self.celebrities_path.iterdir():
            if celeb_dir.is_dir():
                photos = (
                    list(celeb_dir.glob("*.jpg")) +
                    list(celeb_dir.glob("*.jpeg")) +
                    list(celeb_dir.glob("*.png"))
                )
                if photos:
                    self.celebrities[celeb_dir.name] = photos
                    self.total_photos += len(photos)
                    logger.debug(f"Loaded {len(photos)} photos for {celeb_dir.name}")

        self.celebrities_count = len(self.celebrities)

    def _compare_with_celebrity(
        self, user_photo_path: str, celebrity_name: str, celebrity_photos: List[Path]
    ) -> Dict[str, Any]:
        """Compare user photo with a single celebrity's photos."""
        best_distance = float("inf")
        best_verified = False

        for photo_path in celebrity_photos:
            try:
                result = DeepFace.verify(
                    img1_path=user_photo_path,
                    img2_path=str(photo_path),
                    model_name=self.settings.model_name,
                    detector_backend=self.settings.detector_backend,
                    enforce_detection=self.settings.enforce_detection,
                )

                distance = result.get("distance", float("inf"))
                logger.info(f"Compare {celebrity_name}: distance={distance:.4f}, verified={result.get('verified', False)}")

                if distance < best_distance:
                    best_distance = distance
                    best_verified = result.get("verified", False)

            except Exception as e:
                logger.warning(f"Error comparing with {celebrity_name}/{photo_path.name}: {e}")
                continue

        logger.info(f"Best match for {celebrity_name}: distance={best_distance:.4f}")
        return {
            "name": celebrity_name,
            "distance": best_distance,
            "verified": best_verified
        }

    def _distance_to_percentage(self, distance: float) -> float:
        """
        Convert DeepFace distance to similarity percentage.

        DeepFace VGG-Face distance:
        - 0.0 = identical faces (100%)
        - 0.4 = threshold for same person (~70%)
        - 0.6 = similar faces (~50%)
        - 1.0+ = different faces (~20%)
        """
        if distance == float("inf"):
            return 0.0

        # Linear mapping with bonus for very close matches
        # distance 0.0 -> 100%, distance 0.4 -> 70%, distance 1.0 -> 25%
        if distance <= 0.1:
            percentage = 100 - (distance * 100)  # 0.0 -> 100%, 0.1 -> 90%
        elif distance <= 0.4:
            percentage = 90 - ((distance - 0.1) * 66.67)  # 0.1 -> 90%, 0.4 -> 70%
        elif distance <= 0.7:
            percentage = 70 - ((distance - 0.4) * 66.67)  # 0.4 -> 70%, 0.7 -> 50%
        else:
            percentage = max(10, 50 - ((distance - 0.7) * 50))  # 0.7 -> 50%, 1.5+ -> 10%

        return round(max(0, min(100, percentage)), 1)

    async def compare(self, file: UploadFile) -> CompareResponse:
        """
        Compare uploaded photo with all celebrities.

        Returns top 3 matches with similarity percentages.
        """
        start_time = time.time()

        # Save uploaded file temporarily
        temp_path = os.path.join(
            self.settings.temp_dir,
            f"upload_{int(time.time() * 1000)}_{file.filename}"
        )

        try:
            # Write uploaded file
            content = await file.read()
            with open(temp_path, "wb") as f:
                f.write(content)

            # Check if face is detected
            face_detected = True
            try:
                DeepFace.extract_faces(
                    img_path=temp_path,
                    detector_backend=self.settings.detector_backend,
                    enforce_detection=True
                )
            except Exception:
                face_detected = False
                logger.info("No face detected in uploaded image")

            # Compare with all celebrities using thread pool for parallelism
            results = []

            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    executor.submit(
                        self._compare_with_celebrity,
                        temp_path,
                        name,
                        photos
                    ): name
                    for name, photos in self.celebrities.items()
                }

                for future in as_completed(futures):
                    try:
                        result = future.result()
                        if result["distance"] < float("inf"):
                            percentage = self._distance_to_percentage(result["distance"])
                            results.append(CelebrityMatch(
                                name=result["name"],
                                percentage=percentage
                            ))
                    except Exception as e:
                        logger.error(f"Error processing celebrity: {e}")

            # Sort by percentage (highest first)
            results.sort(key=lambda x: x.percentage, reverse=True)

            processing_time = (time.time() - start_time) * 1000

            return CompareResponse(
                matches=results[:3],
                processing_time_ms=round(processing_time, 2),
                face_detected=face_detected
            )

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
