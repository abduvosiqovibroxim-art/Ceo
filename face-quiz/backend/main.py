"""
Face Quiz API - FastAPI Backend
With YOLO Detection Integration
"""

from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import logging

from app.face_analyzer import face_analyzer
from app.yolo_client import yolo_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Face Quiz API", version="2.0.0", description="Face Quiz with YOLO Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_path = Path(__file__).parent
celebrities_path = base_path / "data" / "celebrities"

if celebrities_path.exists():
    app.mount("/celebrities", StaticFiles(directory=str(celebrities_path)), name="celebrities")


@app.on_event("startup")
async def startup_event():
    face_analyzer.initialize()
    # Check YOLO API availability
    yolo_available = await yolo_client.health_check()
    if yolo_available:
        logger.info("YOLO API is available at localhost:8002")
    else:
        logger.warning("YOLO API not available - will continue without person detection")


@app.get("/")
async def root():
    return {"status": "ok", "service": "Face Quiz API", "version": "2.0.0", "yolo_integration": True}


@app.get("/health")
async def health():
    yolo_status = await yolo_client.health_check()
    return {
        "status": "healthy",
        "yolo_api": "connected" if yolo_status else "unavailable"
    }


@app.get("/api/celebrities")
async def get_celebrities():
    celebrities = []
    for celeb_id, data in face_analyzer.celebrity_db.items():
        celebrities.append({
            "id": celeb_id,
            "name": data["name"],
            "name_uz": data.get("name_uz", data["name"]),
            "category": data.get("category", "celebrity"),
            "image": data.get("image", f"/celebrities/{celeb_id}.jpg")
        })
    return {"celebrities": celebrities, "total": len(celebrities)}


@app.post("/api/analyze")
async def analyze_face(image: UploadFile = File(...)):
    """
    Analyze face with YOLO pre-detection
    1. Send image to YOLO API for person detection
    2. If person detected, proceed with DeepFace analysis
    3. Return similarity results
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await image.read()

        # Step 1: YOLO Detection
        logger.info("Sending image to YOLO API for detection...")
        yolo_result = await yolo_client.detect(contents)

        if not yolo_result.success:
            logger.error(f"YOLO detection failed: {yolo_result.error}")
            # Continue anyway if YOLO is unavailable

        if yolo_result.success and not yolo_result.person_detected:
            logger.warning("No person detected in image")
            return JSONResponse(content={
                "success": False,
                "error": "no_person",
                "error_message": "Человек не обнаружен на фото. Пожалуйста, загрузите фото с человеком.",
                "yolo_detections": len(yolo_result.detections)
            })

        logger.info(f"YOLO detected person: {yolo_result.person_detected}, bbox: {yolo_result.best_person_bbox}")

        # Step 2: Decode image for DeepFace
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Step 3: Optional crop to person bbox
        if yolo_result.best_person_bbox:
            bbox = yolo_result.best_person_bbox
            x, y = int(bbox["x"]), int(bbox["y"])
            w, h = int(bbox["width"]), int(bbox["height"])

            # Add padding around person
            padding = 20
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(img.shape[1], x + w + padding)
            y2 = min(img.shape[0], y + h + padding)

            cropped_img = img[y1:y2, x1:x2]
            if cropped_img.size > 0:
                logger.info(f"Cropped image to person bbox: {x1},{y1} -> {x2},{y2}")
                img = cropped_img

        # Step 4: DeepFace analysis
        result = face_analyzer.analyze(img, top_k=3)

        # Add YOLO info to result
        if isinstance(result, dict):
            result["yolo_detection"] = {
                "person_detected": yolo_result.person_detected,
                "confidence": yolo_result.best_person_bbox.get("confidence", 0) if yolo_result.best_person_bbox else 0,
                "total_detections": len(yolo_result.detections)
            }

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return JSONResponse(content={
            "success": False,
            "error": "processing_error",
            "error_message": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
