"""
Mock API for Stario Platform - serves artists data
Run: python mock-api.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Stario Mock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTISTS = [
    {"id": "1", "name": "Юлдуз Усмонова", "description": "Легенда узбекской эстрады", "image": "/celebrities/yulduz_usmonova.jpg", "category": "pop", "gender": "female", "price": 500000, "followers": "1.2M", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "2", "name": "Шахзода", "description": "Поп-звезда Узбекистана", "image": "/celebrities/shahzoda.jpg", "category": "pop", "gender": "female", "price": 450000, "followers": "980K", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "3", "name": "Озода Нурсаидова", "description": "Известная певица", "image": "/celebrities/ozoda_nursaidova.jpg", "category": "pop", "gender": "female", "price": 400000, "followers": "850K", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "4", "name": "Севара Назархан", "description": "Мировая звезда world music", "image": "/celebrities/sevara_nazarkhan.jpg", "category": "traditional", "gender": "female", "price": 550000, "followers": "750K", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "5", "name": "Шохруххон", "description": "Король узбекской эстрады", "image": "/celebrities/shohruhxon.jpg", "category": "pop", "gender": "male", "price": 600000, "followers": "1.5M", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "6", "name": "Райхон", "description": "Поп-дива", "image": "/celebrities/rayhon.jpg", "category": "pop", "gender": "female", "price": 480000, "followers": "920K", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
    {"id": "7", "name": "Лола Юлдашева", "description": "Звезда эстрады", "image": "/celebrities/lola_yuldasheva.jpg", "category": "pop", "gender": "female", "price": 420000, "followers": "780K", "is_verified": True, "is_popular": True, "status": "active", "email": None, "phone": None, "created_at": "2024-01-01", "updated_at": "2024-01-01"},
]

@app.get("/")
def root():
    return {"status": "ok", "service": "Stario Mock API"}

@app.get("/artists")
def get_artists(page: int = 1, page_size: int = 10, category: str = None, gender: str = None, search: str = None):
    filtered = ARTISTS
    if category:
        filtered = [a for a in filtered if a["category"] == category]
    if gender:
        filtered = [a for a in filtered if a["gender"] == gender]
    if search:
        filtered = [a for a in filtered if search.lower() in a["name"].lower()]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    items = filtered[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@app.get("/artists/stats")
def get_stats():
    return {"total": len(ARTISTS), "active": len(ARTISTS), "pending": 0, "suspended": 0, "verified": 6, "popular": 5}

@app.get("/artists/{artist_id}")
def get_artist(artist_id: str):
    for a in ARTISTS:
        if a["id"] == artist_id:
            return a
    return {"error": "Not found"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
