from ultralytics import YOLO
from PIL import Image
import numpy as np
from typing import List, Tuple
import logging

from app.config import get_settings
from app.schemas import Detection, BoundingBox

logger = logging.getLogger(__name__)


class YOLODetector:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self) -> None:
        if self._model is not None:
            return

        settings = get_settings()
        logger.info(f"Loading YOLO model from {settings.model_path}")
        logger.info(f"Using device: {settings.device}")

        self._model = YOLO(settings.model_path)
        self._model.to(settings.device)

        logger.info("Model loaded successfully")

    @property
    def model(self) -> YOLO:
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        return self._model

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def detect(self, image: Image.Image) -> Tuple[List[Detection], int, int]:
        settings = get_settings()

        results = self.model.predict(
            source=image,
            conf=settings.confidence_threshold,
            iou=settings.iou_threshold,
            max_det=settings.max_detections,
            verbose=False
        )

        detections = []
        result = results[0]

        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            names = result.names

            for box, conf, cls_id in zip(boxes, confidences, class_ids):
                detection = Detection(
                    class_id=int(cls_id),
                    class_name=names[cls_id],
                    confidence=float(conf),
                    bbox=BoundingBox(
                        x1=float(box[0]),
                        y1=float(box[1]),
                        x2=float(box[2]),
                        y2=float(box[3])
                    )
                )
                detections.append(detection)

        orig_shape = result.orig_shape
        return detections, orig_shape[1], orig_shape[0]


def get_detector() -> YOLODetector:
    return YOLODetector()
