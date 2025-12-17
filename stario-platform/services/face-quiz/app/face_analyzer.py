"""
Face Quiz - Face Analysis Engine
Using DeepFace library with Facenet512
"""

import os
import pickle
import numpy as np
import cv2
from pathlib import Path
from typing import Optional
import math

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("Warning: DeepFace not installed")


class FaceAnalyzer:
    def __init__(self, celebrity_db_path: str = "data/celebrity_embeddings.pkl"):
        self.celebrity_db_path = Path(celebrity_db_path)
        self.celebrity_db: dict = {}
        self._initialized = False
        self.model_name = "Facenet512"
        self.detector_backend = "opencv"

    def initialize(self):
        if self._initialized:
            return
        if not DEEPFACE_AVAILABLE:
            print("DeepFace not available, using demo mode")
            self.celebrity_db = self._get_demo_database()
            self._initialized = True
            return
        print("Initializing DeepFace...")
        try:
            test_img = np.zeros((224, 224, 3), dtype=np.uint8)
            test_img[50:150, 50:150] = [200, 180, 160]
            DeepFace.represent(img_path=test_img, model_name=self.model_name, detector_backend="skip", enforce_detection=False)
            print("DeepFace model loaded")
        except Exception as e:
            print(f"Warning: {e}")
        self._load_celebrity_database()
        self._initialized = True
        print(f"Initialized. Celebrities: {len(self.celebrity_db)}")

    def _load_celebrity_database(self):
        if self.celebrity_db_path.exists():
            try:
                with open(self.celebrity_db_path, 'rb') as f:
                    self.celebrity_db = pickle.load(f)
                print(f"Loaded: {len(self.celebrity_db)} celebrities")
            except Exception as e:
                print(f"Error loading db: {e}")
                self.celebrity_db = self._get_demo_database()
        else:
            print("Database not found, using demo")
            self.celebrity_db = self._get_demo_database()

    def _get_demo_database(self) -> dict:
        np.random.seed(42)
        return {
            "yulduz_usmonova": {"name": "Юлдуз Усмонова", "name_uz": "Yulduz Usmonova", "category": "singer", "image": "/celebrities/yulduz_usmonova.jpg", "embedding": np.random.randn(512).astype(np.float32)},
            "shahzoda": {"name": "Шаҳзода", "name_uz": "Shahzoda", "category": "singer", "image": "/celebrities/shahzoda.jpg", "embedding": np.random.randn(512).astype(np.float32)},
            "ulugbek_rahmatullayev": {"name": "Улуғбек Раҳматуллаев", "name_uz": "Ulug'bek Rahmatullayev", "category": "singer", "image": "/celebrities/ulugbek_rahmatullayev.jpg", "embedding": np.random.randn(512).astype(np.float32)},
        }

    def analyze(self, image: np.ndarray, top_k: int = 3) -> dict:
        if not self._initialized:
            self.initialize()
        if not DEEPFACE_AVAILABLE:
            return self._demo_analyze(top_k)
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = DeepFace.represent(img_path=rgb_image, model_name=self.model_name, detector_backend=self.detector_backend, enforce_detection=True)
            if not result:
                return {"success": False, "error": "no_face_detected", "error_message": "Face not detected"}
            face_data = result[0]
            user_embedding = np.array(face_data["embedding"], dtype=np.float32)
            facial_area = face_data.get("facial_area", {})
            bbox = [facial_area.get("x", 0), facial_area.get("y", 0), facial_area.get("x", 0) + facial_area.get("w", 100), facial_area.get("y", 0) + facial_area.get("h", 100)]
            matches = self._find_matches(user_embedding, top_k)
            return {"success": True, "matches": matches, "face_bbox": bbox}
        except ValueError as e:
            if "face" in str(e).lower():
                return {"success": False, "error": "no_face_detected", "error_message": "Face not detected"}
            return {"success": False, "error": "processing_error", "error_message": str(e)}
        except Exception as e:
            return {"success": False, "error": "processing_error", "error_message": str(e)}

    def _demo_analyze(self, top_k: int) -> dict:
        matches = []
        for celeb_id, data in list(self.celebrity_db.items())[:top_k]:
            matches.append({"id": celeb_id, "name": data["name"], "name_uz": data.get("name_uz", data["name"]), "category": data.get("category", "celebrity"), "image": data.get("image"), "percentage": np.random.randint(55, 85)})
        matches.sort(key=lambda x: x["percentage"], reverse=True)
        return {"success": True, "matches": matches, "face_bbox": [50, 50, 200, 250], "demo_mode": True}

    def _find_matches(self, user_embedding: np.ndarray, top_k: int) -> list:
        results = []
        for celeb_id, data in self.celebrity_db.items():
            celeb_embedding = data["embedding"]
            user_norm = user_embedding / (np.linalg.norm(user_embedding) + 1e-10)
            celeb_norm = celeb_embedding / (np.linalg.norm(celeb_embedding) + 1e-10)
            similarity = float(np.dot(user_norm, celeb_norm))
            percentage = self._similarity_to_percentage(similarity)
            results.append({"id": celeb_id, "name": data["name"], "name_uz": data.get("name_uz", data["name"]), "category": data.get("category", "celebrity"), "image": data.get("image"), "percentage": percentage})
        results.sort(key=lambda x: x["percentage"], reverse=True)
        return results[:top_k]

    def _similarity_to_percentage(self, similarity: float) -> int:
        x = (similarity - 0.35) * 8
        sigmoid = 1 / (1 + math.exp(-x))
        percentage = int(35 + sigmoid * 57)
        return min(92, max(35, percentage))

    def get_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        if not self._initialized:
            self.initialize()
        if not DEEPFACE_AVAILABLE:
            return None
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = DeepFace.represent(img_path=rgb_image, model_name=self.model_name, detector_backend=self.detector_backend, enforce_detection=True)
            if result:
                return np.array(result[0]["embedding"], dtype=np.float32)
        except Exception as e:
            print(f"Error: {e}")
        return None


face_analyzer = FaceAnalyzer()
