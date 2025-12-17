from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from PIL import Image
import io
import logging

from app.config import get_settings, Settings
from app.model import YOLODetector, get_detector
from app.schemas import DetectionResponse, HealthResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    detector = get_detector()
    detector.load_model()
    yield
    logger.info("Shutting down")


app = FastAPI(
    title="YOLO Object Detection API",
    description="Production-ready API for object detection using YOLO",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def validate_image(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


async def read_image(file: UploadFile) -> Image.Image:
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    try:
        image = Image.open(io.BytesIO(contents))
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image
    except Exception as e:
        logger.error(f"Failed to process image: {e}")
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )


@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(
    file: UploadFile = File(..., description="Image file for object detection"),
    detector: YOLODetector = Depends(get_detector)
) -> DetectionResponse:
    validate_image(file)
    image = await read_image(file)

    try:
        detections, width, height = detector.detect(image)
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Object detection failed"
        )

    return DetectionResponse(
        detections=detections,
        count=len(detections),
        image_width=width,
        image_height=height
    )


@app.get("/health", response_model=HealthResponse)
async def health_check(
    settings: Settings = Depends(get_settings),
    detector: YOLODetector = Depends(get_detector)
) -> HealthResponse:
    return HealthResponse(
        status="healthy" if detector.is_loaded else "unhealthy",
        model_loaded=detector.is_loaded,
        device=settings.device,
        model_path=settings.model_path
    )


@app.get("/")
async def root():
    return {"message": "YOLO Object Detection API", "docs": "/docs"}
