"""AI Poster Maker with REAL Face Swap on Couple Templates."""

import os
import uuid
import logging
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import asyncio
import random

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

from app.config import get_settings
from app.models import (
    Celebrity, Template, SceneType, CelebrityCategory,
    FaceUploadResponse, GenerateResponse, JobStatus
)

logger = logging.getLogger(__name__)


# ============================================================================
# STYLE CONFIGURATIONS
# ============================================================================

STYLES = {
    "blockbuster": {
        "name": "Блокбастер",
        "name_uz": "Blokbaster",
        "description": "Эпичный экшн как Мстители",
        "colors": {"primary": (255, 140, 0), "secondary": (0, 100, 200), "accent": (255, 200, 50)},
    },
    "noir": {
        "name": "Нуар",
        "name_uz": "Noir",
        "description": "Чёрно-белый детектив",
        "colors": {"primary": (255, 255, 255), "secondary": (100, 100, 100), "accent": (200, 50, 50)},
    },
    "neon": {
        "name": "Неон",
        "name_uz": "Neon",
        "description": "Киберпанк с неоновым светом",
        "colors": {"primary": (255, 0, 255), "secondary": (0, 255, 255), "accent": (255, 100, 200)},
    },
    "romance": {
        "name": "Романтика",
        "name_uz": "Romantika",
        "description": "Нежная любовная история",
        "colors": {"primary": (255, 200, 150), "secondary": (255, 150, 180), "accent": (255, 220, 180)},
    },
    "drama": {
        "name": "Драма",
        "name_uz": "Drama",
        "description": "Глубокая эмоциональная история",
        "colors": {"primary": (180, 180, 200), "secondary": (100, 120, 150), "accent": (200, 200, 220)},
    },
    "action": {
        "name": "Боевик",
        "name_uz": "Jangari",
        "description": "Жёсткий экшн как Джон Уик",
        "colors": {"primary": (255, 50, 0), "secondary": (20, 20, 20), "accent": (255, 150, 0)},
    },
    "retro80": {
        "name": "Ретро 80-х",
        "name_uz": "Retro 80",
        "description": "Synthwave стиль VHS",
        "colors": {"primary": (255, 100, 150), "secondary": (100, 200, 255), "accent": (200, 100, 255)},
    },
    "netflix": {
        "name": "Netflix",
        "name_uz": "Netflix",
        "description": "Как обложка сериала Netflix",
        "colors": {"primary": (255, 255, 255), "secondary": (229, 9, 20), "accent": (200, 200, 200)},
    },
    "minimalism": {
        "name": "Минимализм",
        "name_uz": "Minimalizm",
        "description": "Чистый простой дизайн",
        "colors": {"primary": (40, 40, 40), "secondary": (200, 200, 200), "accent": (100, 150, 200)},
    },
    "superhero": {
        "name": "Супергерой",
        "name_uz": "Superqahramon",
        "description": "Комиксовый стиль Marvel",
        "colors": {"primary": (255, 220, 0), "secondary": (200, 0, 0), "accent": (0, 100, 200)},
    },
}


class FaceSwapService:
    """Service for AI Poster generation with REAL face swap on couple templates."""

    def __init__(self):
        self.settings = get_settings()
        self.base_dir = self.settings.base_dir
        self.celebrities_path = self.base_dir / self.settings.celebrities_path
        self.templates_path = self.base_dir / "templates"
        self.couples_path = self.templates_path / "couples"
        self.fonts_path = self.base_dir / "fonts"
        self.temp_dir = self.base_dir / self.settings.temp_dir

        # Ensure directories exist
        for path in [self.temp_dir, self.templates_path, self.couples_path, self.fonts_path]:
            os.makedirs(path, exist_ok=True)

        # Initialize OpenCV Face Detection (Haar Cascade + DNN)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        # Try to load DNN-based face detector (more accurate)
        self.dnn_face_detector = None
        try:
            prototxt_path = cv2.data.haarcascades.replace('haarcascades', 'dnn') + 'deploy.prototxt'
            model_path = cv2.data.haarcascades.replace('haarcascades', 'dnn') + 'res10_300x300_ssd_iter_140000.caffemodel'
            if os.path.exists(prototxt_path) and os.path.exists(model_path):
                self.dnn_face_detector = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
                logger.info("DNN face detector loaded")
        except Exception as e:
            logger.warning(f"Could not load DNN face detector: {e}")

        # Job tracking
        self.jobs: Dict[str, Dict] = {}

        # Celebrity images cache
        self.celebrity_images: Dict[str, List[str]] = {}

        # Couple templates cache
        self.couple_templates: List[str] = []
        self._load_couple_templates()

        # Load data
        self.celebrities: List[Celebrity] = []
        self.templates: List[Template] = []
        self._load_celebrities()
        self._create_style_templates()

        logger.info(f"FaceSwapService initialized. "
                    f"Celebrities: {len(self.celebrities)}, Styles: {len(STYLES)}, "
                    f"Couple Templates: {len(self.couple_templates)}")

    def _load_couple_templates(self):
        """Load couple template images for face swap."""
        self.couple_templates = []

        if self.couples_path.exists():
            for img_file in self.couples_path.glob("*.jpg"):
                self.couple_templates.append(str(img_file))
            for img_file in self.couples_path.glob("*.png"):
                self.couple_templates.append(str(img_file))

        logger.info(f"Loaded {len(self.couple_templates)} couple templates")

    def _load_celebrities(self):
        """Load celebrities from data directory."""
        self.celebrities = []

        name_mappings = {
            "Ali Otajonov": ("Али Отажонов", "Ali Otajonov"),
            "Dilsoz": ("Дильсоз", "Dilsoz"),
            "Farukh Zakirov": ("Фарух Закиров", "Farukh Zakirov"),
            "Jahondi Poziljonov": ("Жахонгир Позилжонов", "Jahondi Poziljonov"),
            "Jasur Umirov": ("Жасур Умиров", "Jasur Umirov"),
            "Lola": ("Лола", "Lola"),
            "Munisa Rizayeva": ("Муниса Ризаева", "Munisa Rizayeva"),
            "Ozoda": ("Озода", "Ozoda"),
            "Ozodbek Nazarbekov": ("Озодбек Назарбеков", "Ozodbek Nazarbekov"),
            "Rayhon": ("Райхон", "Rayhon"),
            "Sevara": ("Севара", "Sevara"),
            "Shahzoda": ("Шахзода", "Shahzoda"),
            "Tohir Sodiqov": ("Тохир Содиков", "Tohir Sodiqov"),
            "Yulduz Usmanova": ("Юлдуз Усмонова", "Yulduz Usmanova"),
            "Ziyoda": ("Зиёда", "Ziyoda"),
        }

        if not self.celebrities_path.exists():
            logger.warning(f"Celebrities path not found: {self.celebrities_path}")
            return

        for celeb_dir in self.celebrities_path.iterdir():
            if celeb_dir.is_dir():
                folder_name = celeb_dir.name
                photos = list(celeb_dir.glob("*.jpg")) + list(celeb_dir.glob("*.png"))

                if photos:
                    if folder_name in name_mappings:
                        name_ru, name_uz = name_mappings[folder_name]
                    else:
                        name_ru = folder_name
                        name_uz = folder_name

                    celeb_id = folder_name.lower().replace(" ", "_")
                    main_photo = photos[0]

                    self.celebrities.append(Celebrity(
                        id=celeb_id,
                        name=name_ru,
                        name_uz=name_uz,
                        image=f"/celebrities/{folder_name}/{main_photo.name}",
                        category=CelebrityCategory.UZBEK,
                        photos_count=len(photos)
                    ))

                    self.celebrity_images[celeb_id] = [str(p) for p in photos]

        logger.info(f"Loaded {len(self.celebrities)} celebrities")

    def _create_style_templates(self):
        """Create template entries for all styles."""
        self.templates = []
        for style_id, style_config in STYLES.items():
            self.templates.append(Template(
                id=style_id,
                name=style_config["name"],
                name_uz=style_config["name_uz"],
                scene_type=SceneType.MOVIE_POSTER,
                preview=f"/templates/{style_id}/preview.jpg",
                description=style_config["description"]
            ))

    # ========================================================================
    # FACE DETECTION (OpenCV DNN + Haar Cascade Fallback)
    # ========================================================================

    def _detect_faces_dnn(self, img: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces using OpenCV DNN (SSD) - more accurate."""
        if self.dnn_face_detector is None:
            return []

        h, w = img.shape[:2]
        blob = cv2.dnn.blobFromImage(img, 1.0, (300, 300), (104.0, 177.0, 123.0))
        self.dnn_face_detector.setInput(blob)
        detections = self.dnn_face_detector.forward()

        faces = []
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.5:  # Confidence threshold
                x1 = int(detections[0, 0, i, 3] * w)
                y1 = int(detections[0, 0, i, 4] * h)
                x2 = int(detections[0, 0, i, 5] * w)
                y2 = int(detections[0, 0, i, 6] * h)

                # Clamp to image bounds
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)

                fw = x2 - x1
                fh = y2 - y1

                if fw > 20 and fh > 20:
                    faces.append((x1, y1, fw, fh))

        # Sort by x coordinate (left to right)
        faces.sort(key=lambda f: f[0])
        return faces

    def _detect_faces_cascade(self, img: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Fallback face detection using Haar Cascade."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # More permissive parameters for better detection on varied images
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,  # More granular scale
            minNeighbors=3,    # Lower threshold for detection
            minSize=(20, 20),  # Smaller minimum face size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        result = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
        result.sort(key=lambda f: f[0])  # Sort left to right
        return result

    def _detect_faces(self, img: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces using DNN first, fallback to Haar Cascade."""
        # Try DNN detector first (more accurate)
        faces = self._detect_faces_dnn(img)
        if not faces:
            # Fallback to Haar Cascade
            faces = self._detect_faces_cascade(img)
        return faces

    # ========================================================================
    # FACE EXTRACTION & BLENDING
    # ========================================================================

    def _extract_face_region(self, img: np.ndarray, face_rect: Tuple[int, int, int, int],
                              padding: float = 0.5) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
        """Extract face region with padding."""
        x, y, w, h = face_rect
        img_h, img_w = img.shape[:2]

        # Add padding
        pad_w = int(w * padding)
        pad_h = int(h * padding)

        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(img_w, x + w + pad_w)
        y2 = min(img_h, y + h + pad_h)

        face_img = img[y1:y2, x1:x2].copy()
        return face_img, (x1, y1, x2 - x1, y2 - y1)

    def _create_face_mask(self, shape: Tuple[int, int]) -> np.ndarray:
        """Create elliptical mask with soft edges."""
        h, w = shape
        mask = np.zeros((h, w), dtype=np.uint8)

        center = (w // 2, h // 2)
        axes = (w // 2 - 10, h // 2 - 10)

        cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)

        # Heavy blur for soft edges
        mask = cv2.GaussianBlur(mask, (51, 51), 25)

        return mask

    def _swap_face(self, target_img: np.ndarray, source_img: np.ndarray,
                   target_face: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Swap a face from source_img onto target_img at target_face position.
        Uses seamlessClone for natural blending.
        """
        # Detect face in source image
        source_faces = self._detect_faces(source_img)
        if not source_faces:
            logger.warning("No face detected in source image")
            return target_img

        source_face = source_faces[0]

        # Extract source face
        src_face_img, _ = self._extract_face_region(source_img, source_face, padding=0.4)

        # Target dimensions
        tx, ty, tw, th = target_face

        # Resize source face to match target face size (slightly larger for better coverage)
        target_size = (int(tw * 1.4), int(th * 1.4))
        src_face_resized = cv2.resize(src_face_img, target_size)

        # Create mask
        mask = self._create_face_mask(src_face_resized.shape[:2])

        # Center point for seamlessClone
        center_x = tx + tw // 2
        center_y = ty + th // 2

        # Ensure center is within bounds
        h, w = target_img.shape[:2]
        center_x = max(target_size[0] // 2, min(center_x, w - target_size[0] // 2))
        center_y = max(target_size[1] // 2, min(center_y, h - target_size[1] // 2))

        try:
            # Use MIXED_CLONE for better color blending
            result = cv2.seamlessClone(
                src_face_resized,
                target_img,
                mask,
                (center_x, center_y),
                cv2.MIXED_CLONE
            )
            return result
        except Exception as e:
            logger.error(f"seamlessClone failed: {e}, using alpha blend fallback")
            return self._alpha_blend_face(target_img, src_face_resized, mask, (center_x, center_y))

    def _alpha_blend_face(self, bg: np.ndarray, face: np.ndarray,
                          mask: np.ndarray, center: Tuple[int, int]) -> np.ndarray:
        """Fallback alpha blending when seamlessClone fails."""
        result = bg.copy()
        h, w = bg.shape[:2]
        fh, fw = face.shape[:2]

        cx, cy = center
        x1 = max(0, cx - fw // 2)
        y1 = max(0, cy - fh // 2)
        x2 = min(w, x1 + fw)
        y2 = min(h, y1 + fh)

        fx1 = max(0, fw // 2 - cx)
        fy1 = max(0, fh // 2 - cy)
        fx2 = fx1 + (x2 - x1)
        fy2 = fy1 + (y2 - y1)

        if fx2 <= fx1 or fy2 <= fy1 or x2 <= x1 or y2 <= y1:
            return result

        alpha = mask[fy1:fy2, fx1:fx2].astype(float) / 255.0
        alpha = alpha[:, :, np.newaxis]

        result[y1:y2, x1:x2] = (
            result[y1:y2, x1:x2] * (1 - alpha) + face[fy1:fy2, fx1:fx2] * alpha
        ).astype(np.uint8)

        return result

    # ========================================================================
    # REAL FACE SWAP ON COUPLE TEMPLATE
    # ========================================================================

    def _swap_faces_on_template(self, template_img: np.ndarray,
                                 user_img: np.ndarray,
                                 celeb_img: np.ndarray) -> np.ndarray:
        """
        REAL face swap: Detect 2 faces in template and replace them.
        Face #1 (left) -> User's face
        Face #2 (right) -> Celebrity's face
        """
        # Detect faces in template
        template_faces = self._detect_faces(template_img)

        if len(template_faces) < 2:
            logger.warning(f"Only found {len(template_faces)} faces in template, need 2")
            # If only 1 face found, still try to swap it
            if len(template_faces) == 1:
                result = self._swap_face(template_img, user_img, template_faces[0])
                return result
            return template_img

        # Swap faces - left face gets user, right face gets celebrity
        # Faces are already sorted left to right
        result = template_img.copy()

        # Swap face #1 (left) with user
        logger.info(f"Swapping left face at {template_faces[0]} with user face")
        result = self._swap_face(result, user_img, template_faces[0])

        # Swap face #2 (right) with celebrity
        logger.info(f"Swapping right face at {template_faces[1]} with celebrity face")
        result = self._swap_face(result, celeb_img, template_faces[1])

        return result

    def _get_random_template(self) -> Optional[np.ndarray]:
        """Get a random couple template image."""
        if not self.couple_templates:
            logger.warning("No couple templates available")
            return None

        template_path = random.choice(self.couple_templates)
        template = cv2.imread(template_path)

        if template is None:
            logger.error(f"Failed to load template: {template_path}")
            return None

        # Resize template to poster dimensions (800x1200)
        h, w = template.shape[:2]
        target_w, target_h = 800, 1200

        # Calculate resize to fill while maintaining aspect
        scale = max(target_w / w, target_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)

        template = cv2.resize(template, (new_w, new_h))

        # Center crop to target size
        start_x = (new_w - target_w) // 2
        start_y = (new_h - target_h) // 2
        template = template[start_y:start_y + target_h, start_x:start_x + target_w]

        return template

    # ========================================================================
    # STYLE EFFECTS
    # ========================================================================

    def _apply_style(self, img: np.ndarray, style_id: str) -> np.ndarray:
        """Apply post-processing effects for each style."""

        if style_id == "noir":
            return self._apply_noir_effect(img)
        elif style_id == "neon":
            return self._apply_neon_effect(img)
        elif style_id == "retro80":
            return self._apply_retro80_effect(img)
        elif style_id == "romance":
            return self._apply_romance_effect(img)
        elif style_id == "action":
            return self._apply_action_effect(img)
        elif style_id == "blockbuster":
            return self._apply_blockbuster_effect(img)
        elif style_id == "netflix":
            return self._apply_netflix_effect(img)
        elif style_id == "minimalism":
            return self._apply_minimalism_effect(img)
        elif style_id == "superhero":
            return self._apply_superhero_effect(img)
        elif style_id == "drama":
            return self._apply_drama_effect(img)
        else:
            return img

    def _apply_noir_effect(self, img: np.ndarray) -> np.ndarray:
        """Black and white with grain and high contrast."""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        # Add film grain
        grain = np.random.normal(0, 15, result.shape).astype(np.int16)
        result = np.clip(result.astype(np.int16) + grain, 0, 255).astype(np.uint8)

        # High contrast
        result = cv2.convertScaleAbs(result, alpha=1.4, beta=-20)

        # Heavy vignette
        result = self._add_vignette(result, strength=0.7)

        return result

    def _apply_neon_effect(self, img: np.ndarray) -> np.ndarray:
        """Cyberpunk neon glow effect."""
        # Boost saturation
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(np.float32) * 1.5, 0, 255).astype(np.uint8)
        result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Add glow
        glow = cv2.GaussianBlur(result, (51, 51), 30)
        result = cv2.addWeighted(result, 0.7, glow, 0.3, 0)

        # Color tint (cyan/magenta)
        result[:, :, 0] = np.clip(result[:, :, 0].astype(np.int16) + 30, 0, 255).astype(np.uint8)
        result[:, :, 2] = np.clip(result[:, :, 2].astype(np.int16) + 20, 0, 255).astype(np.uint8)

        return result

    def _apply_retro80_effect(self, img: np.ndarray) -> np.ndarray:
        """Synthwave 80s VHS effect."""
        result = img.copy()

        # Pink/cyan color cast
        result[:, :, 0] = np.clip(result[:, :, 0].astype(np.int16) + 30, 0, 255).astype(np.uint8)
        result[:, :, 2] = np.clip(result[:, :, 2].astype(np.int16) + 20, 0, 255).astype(np.uint8)

        # Scanlines
        h, w = result.shape[:2]
        for y in range(0, h, 4):
            result[y:y+2, :] = np.clip(result[y:y+2, :].astype(np.int16) - 30, 0, 255).astype(np.uint8)

        # Chromatic aberration
        b, g, r = cv2.split(result)
        r = np.roll(r, 2, axis=1)
        b = np.roll(b, -2, axis=1)
        result = cv2.merge([b, g, r])

        # Slight blur (VHS look)
        result = cv2.GaussianBlur(result, (3, 3), 1)

        return result

    def _apply_romance_effect(self, img: np.ndarray) -> np.ndarray:
        """Soft warm romantic glow."""
        result = img.copy()

        # Warm temperature
        result[:, :, 0] = np.clip(result[:, :, 0].astype(np.int16) - 20, 0, 255).astype(np.uint8)
        result[:, :, 2] = np.clip(result[:, :, 2].astype(np.int16) + 30, 0, 255).astype(np.uint8)

        # Soft glow
        glow = cv2.GaussianBlur(result, (31, 31), 15)
        result = cv2.addWeighted(result, 0.6, glow, 0.4, 0)

        # Light vignette
        result = self._add_vignette(result, strength=0.3)

        return result

    def _apply_action_effect(self, img: np.ndarray) -> np.ndarray:
        """High contrast teal/orange action look."""
        result = img.copy()

        # Increase contrast
        result = cv2.convertScaleAbs(result, alpha=1.3, beta=-10)

        # Teal shadows, orange highlights
        lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB)
        l, a, b_ch = cv2.split(lab)

        b_ch = b_ch.astype(np.int16)
        b_ch = np.where(l < 128, b_ch - 15, b_ch + 15)
        b_ch = np.clip(b_ch, 0, 255).astype(np.uint8)

        result = cv2.cvtColor(cv2.merge([l, a, b_ch]), cv2.COLOR_LAB2BGR)

        return result

    def _apply_blockbuster_effect(self, img: np.ndarray) -> np.ndarray:
        """Epic blockbuster with teal/orange and lens flares."""
        result = self._apply_action_effect(img)

        # Add lens flare spots
        h, w = result.shape[:2]
        for _ in range(3):
            x = random.randint(w // 4, 3 * w // 4)
            y = random.randint(h // 4, h // 2)
            overlay = result.copy()
            cv2.circle(overlay, (x, y), random.randint(30, 60), (200, 220, 255), -1)
            cv2.addWeighted(overlay, 0.2, result, 0.8, 0, result)

        return result

    def _apply_netflix_effect(self, img: np.ndarray) -> np.ndarray:
        """Dark moody Netflix style."""
        result = img.copy()

        # Darken
        result = cv2.convertScaleAbs(result, alpha=0.8, beta=-20)

        # Slight red tint
        result[:, :, 2] = np.clip(result[:, :, 2].astype(np.int16) + 10, 0, 255).astype(np.uint8)

        # Strong vignette
        result = self._add_vignette(result, strength=0.6)

        return result

    def _apply_minimalism_effect(self, img: np.ndarray) -> np.ndarray:
        """Clean minimal look."""
        result = img.copy()

        # Reduce saturation
        hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = (hsv[:, :, 1].astype(np.float32) * 0.4).astype(np.uint8)
        result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Brighten
        result = cv2.convertScaleAbs(result, alpha=1.0, beta=20)

        return result

    def _apply_superhero_effect(self, img: np.ndarray) -> np.ndarray:
        """Vibrant comic book style."""
        result = img.copy()

        # Boost saturation
        hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(np.float32) * 1.6, 0, 255).astype(np.uint8)
        result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Comic edge effect
        edges = cv2.Canny(result, 50, 150)
        edges = cv2.dilate(edges, None)
        edges_3ch = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        result = cv2.subtract(result, edges_3ch * 0.3)

        # High contrast
        result = cv2.convertScaleAbs(result, alpha=1.2, beta=10)

        return result

    def _apply_drama_effect(self, img: np.ndarray) -> np.ndarray:
        """Muted dramatic look."""
        result = img.copy()

        # Desaturate
        hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = (hsv[:, :, 1].astype(np.float32) * 0.7).astype(np.uint8)
        result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Blue tint
        result[:, :, 0] = np.clip(result[:, :, 0].astype(np.int16) + 15, 0, 255).astype(np.uint8)

        # Soft focus
        blur = cv2.GaussianBlur(result, (5, 5), 2)
        result = cv2.addWeighted(result, 0.8, blur, 0.2, 0)

        return result

    def _add_vignette(self, img: np.ndarray, strength: float = 0.5) -> np.ndarray:
        """Add vignette effect."""
        h, w = img.shape[:2]
        Y, X = np.ogrid[:h, :w]
        center = (w // 2, h // 2)
        dist = np.sqrt((X - center[0])**2 + (Y - center[1])**2)
        max_dist = np.sqrt(center[0]**2 + center[1]**2)
        vignette = 1 - (dist / max_dist) ** 1.5 * strength
        vignette = np.clip(vignette, 1 - strength, 1)

        result = img.copy()
        for c in range(3):
            result[:, :, c] = (result[:, :, c] * vignette).astype(np.uint8)

        return result

    # ========================================================================
    # WATERMARK ONLY
    # ========================================================================

    def _add_poster_text(self, img: np.ndarray, celebrity_name: str,
                         style_id: str, custom_title: str = None) -> np.ndarray:
        """Add only watermark - no other text."""
        img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(img_pil)
        W, H = img_pil.size

        try:
            small_font = ImageFont.truetype("arial.ttf", 16)
        except:
            small_font = ImageFont.load_default()

        # Only watermark
        draw.text((W - 80, H - 20), "stario.uz", font=small_font, fill=(255, 255, 255, 128))

        return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

    # ========================================================================
    # API METHODS
    # ========================================================================

    async def upload_face(self, file_content: bytes, filename: str) -> FaceUploadResponse:
        """Upload and analyze user's face."""
        face_id = str(uuid.uuid4())[:8]
        temp_path = self.temp_dir / f"{face_id}_{filename}"

        with open(temp_path, "wb") as f:
            f.write(file_content)

        try:
            img = cv2.imread(str(temp_path))
            if img is None:
                return FaceUploadResponse(
                    face_id=face_id, preview_url="", face_detected=False,
                    face_quality="low", message="Не удалось загрузить изображение"
                )

            faces = self._detect_faces(img)

            if len(faces) == 0:
                return FaceUploadResponse(
                    face_id=face_id, preview_url="", face_detected=False,
                    face_quality="low", message="Лицо не обнаружено. Загрузите фото с чётким лицом."
                )

            if len(faces) > 1:
                return FaceUploadResponse(
                    face_id=face_id, preview_url="", face_detected=False,
                    face_quality="low", message="На фото несколько лиц. Загрузите фото с одним лицом."
                )

            x, y, w, h = faces[0]
            img_area = img.shape[0] * img.shape[1]
            face_ratio = (w * h) / img_area

            if face_ratio < 0.03:
                quality, message = "low", "Лицо слишком маленькое."
            elif face_ratio < 0.1:
                quality, message = "medium", "Качество среднее."
            else:
                quality, message = "high", "Отлично! Лицо чётко видно."

            # Save
            original_path = self.temp_dir / f"{face_id}_original.jpg"
            cv2.imwrite(str(original_path), img)

            preview_img = img.copy()
            cv2.rectangle(preview_img, (x, y), (x + w, y + h), (0, 255, 0), 3)
            preview_path = self.temp_dir / f"{face_id}_preview.jpg"
            cv2.imwrite(str(preview_path), preview_img)

            return FaceUploadResponse(
                face_id=face_id,
                preview_url=f"/temp/{face_id}_preview.jpg",
                face_detected=True,
                face_quality=quality,
                message=message
            )

        except Exception as e:
            logger.error(f"Error: {e}")
            return FaceUploadResponse(
                face_id=face_id, preview_url="", face_detected=False,
                face_quality="low", message=f"Ошибка: {str(e)}"
            )

    async def start_generation(self, face_id: str, celebrity_id: str,
                               template_id: str) -> GenerateResponse:
        """Start poster generation."""
        job_id = str(uuid.uuid4())[:8]

        celebrity = next((c for c in self.celebrities if c.id == celebrity_id), None)
        if not celebrity:
            return GenerateResponse(job_id=job_id, status=JobStatus.FAILED,
                                   error="Знаменитость не найдена")

        if template_id not in STYLES:
            return GenerateResponse(job_id=job_id, status=JobStatus.FAILED,
                                   error="Стиль не найден")

        original_path = self.temp_dir / f"{face_id}_original.jpg"
        if not original_path.exists():
            return GenerateResponse(job_id=job_id, status=JobStatus.FAILED,
                                   error="Фото не найдено")

        self.jobs[job_id] = {
            "status": JobStatus.PROCESSING,
            "progress": 0,
            "stage": "Подготовка...",
            "face_id": face_id,
            "celebrity_id": celebrity_id,
            "style_id": template_id,
            "result_url": None,
            "error": None
        }

        asyncio.create_task(self._generate_poster(job_id))

        return GenerateResponse(job_id=job_id, status=JobStatus.PROCESSING,
                               progress=0, stage="Подготовка...")

    async def _generate_poster(self, job_id: str):
        """Generate poster with REAL face swap on couple template."""
        job = self.jobs.get(job_id)
        if not job:
            return

        try:
            face_id = job["face_id"]
            celebrity_id = job["celebrity_id"]
            style_id = job["style_id"]
            style_config = STYLES[style_id]

            # Stage 1: Load images
            job["stage"] = "Загрузка фото..."
            job["progress"] = 10
            await asyncio.sleep(0.2)

            user_img = cv2.imread(str(self.temp_dir / f"{face_id}_original.jpg"))
            if user_img is None:
                raise Exception("Не удалось загрузить ваше фото")

            celeb_img = None
            if celebrity_id in self.celebrity_images:
                celeb_path = random.choice(self.celebrity_images[celebrity_id])
                celeb_img = cv2.imread(celeb_path)
            if celeb_img is None:
                raise Exception("Фото знаменитости не найдено")

            celebrity = next(c for c in self.celebrities if c.id == celebrity_id)

            # Stage 2: Load couple template
            job["stage"] = "Загрузка шаблона..."
            job["progress"] = 25
            await asyncio.sleep(0.2)

            template = self._get_random_template()
            if template is None:
                raise Exception("Шаблон с парой не найден. Добавьте фото в templates/couples/")

            # Stage 3: REAL Face Swap
            job["stage"] = "AI замена лиц..."
            job["progress"] = 40
            await asyncio.sleep(0.5)

            result = self._swap_faces_on_template(template, user_img, celeb_img)

            # Stage 4: Apply style effects
            job["stage"] = f"Применение стиля {style_config['name']}..."
            job["progress"] = 70
            await asyncio.sleep(0.3)

            result = self._apply_style(result, style_id)

            # Stage 5: Add text
            job["stage"] = "Добавление текста..."
            job["progress"] = 85
            await asyncio.sleep(0.2)

            result = self._add_poster_text(result, celebrity.name, style_id)

            # Stage 6: Save
            job["stage"] = "Сохранение..."
            job["progress"] = 95
            await asyncio.sleep(0.1)

            result_path = self.temp_dir / f"{job_id}_result.jpg"
            cv2.imwrite(str(result_path), result, [cv2.IMWRITE_JPEG_QUALITY, 95])

            job["status"] = JobStatus.COMPLETED
            job["progress"] = 100
            job["stage"] = "Готово!"
            job["result_url"] = f"/temp/{job_id}_result.jpg"

        except Exception as e:
            logger.error(f"Generation error: {e}")
            job["status"] = JobStatus.FAILED
            job["error"] = str(e)

    def get_job_status(self, job_id: str) -> Optional[GenerateResponse]:
        """Get job status."""
        job = self.jobs.get(job_id)
        if not job:
            return None
        return GenerateResponse(
            job_id=job_id, status=job["status"], progress=job["progress"],
            stage=job.get("stage"), result_url=job.get("result_url"), error=job.get("error")
        )

    def get_celebrities(self, category: Optional[CelebrityCategory] = None) -> List[Celebrity]:
        """Get celebrities."""
        if category:
            return [c for c in self.celebrities if c.category == category]
        return self.celebrities

    def get_templates(self) -> List[Template]:
        """Get all style templates."""
        return self.templates

    def is_ready(self) -> bool:
        """Check if service is ready."""
        return len(self.celebrities) > 0 and len(self.couple_templates) > 0
