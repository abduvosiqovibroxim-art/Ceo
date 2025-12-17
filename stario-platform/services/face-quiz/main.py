"""
Face Quiz - All in one on port 8001
"""

from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import numpy as np
import cv2

from app.face_analyzer import face_analyzer

app = FastAPI(title="Face Quiz", version="1.0.0")

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

@app.get("/")
async def index():
    return FileResponse(base_path / "static" / "index.html")

@app.get("/health")
async def health():
    return {"status": "healthy"}

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
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        result = face_analyzer.analyze(img, top_k=3)
        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "error": "processing_error",
            "error_message": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
