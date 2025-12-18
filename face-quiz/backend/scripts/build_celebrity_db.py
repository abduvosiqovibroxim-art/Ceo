"""
Build celebrity database with embeddings
Downloads images and creates embeddings using DeepFace
"""

import os
import sys
import pickle
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

CELEBRITIES = {
    "yulduz_usmonova": {
        "name": "Юлдуз Усмонова",
        "name_uz": "Yulduz Usmonova",
        "category": "singer",
    },
    "shahzoda": {
        "name": "Шаҳзода",
        "name_uz": "Shahzoda",
        "category": "singer",
    },
    "ozoda_nursaidova": {
        "name": "Озода Нурсаидова",
        "name_uz": "Ozoda Nursaidova",
        "category": "singer",
    },
    "sevara_nazarkhan": {
        "name": "Севара Назархан",
        "name_uz": "Sevara Nazarxon",
        "category": "singer",
    },
    "lola_yuldasheva": {
        "name": "Лола Юлдашева",
        "name_uz": "Lola Yuldasheva",
        "category": "singer",
    },
    "rayhon": {
        "name": "Райҳон",
        "name_uz": "Rayhon",
        "category": "singer",
    },
    "jasur_umirov": {
        "name": "Жасур Умиров",
        "name_uz": "Jasur Umirov",
        "category": "singer",
    },
    "shohruhxon": {
        "name": "Шоҳруҳхон",
        "name_uz": "Shohruhxon",
        "category": "singer",
    },
    "bobur_akilkhanov": {
        "name": "Бобур Акилханов",
        "name_uz": "Bobur Akilxonov",
        "category": "actor",
    },
    "umid_shahobiddinov": {
        "name": "Умид Шаҳобиддинов",
        "name_uz": "Umid Shahobiddinov",
        "category": "singer",
    },
}


def build_database():
    base_path = Path(__file__).parent.parent
    celebrities_path = base_path / "data" / "celebrities"
    celebrities_path.mkdir(parents=True, exist_ok=True)
    db_path = base_path / "data" / "celebrity_embeddings.pkl"

    try:
        from deepface import DeepFace
        import cv2
        deepface_available = True
        print("DeepFace available")
    except ImportError:
        deepface_available = False
        print("DeepFace not available")

    celebrity_db = {}
    real_photos_found = 0

    for celeb_id, data in CELEBRITIES.items():
        print(f"\nProcessing: {data['name_uz']}")
        img_path = celebrities_path / f"{celeb_id}.jpg"

        embedding = None

        if deepface_available and img_path.exists():
            try:
                img = cv2.imread(str(img_path))
                if img is not None and img.size > 50000:  # Real photo should be > 50KB
                    result = DeepFace.represent(
                        img_path=img,
                        model_name="Facenet512",
                        detector_backend="opencv",
                        enforce_detection=False
                    )
                    if result:
                        embedding = np.array(result[0]["embedding"], dtype=np.float32)
                        print(f"  Real embedding created")
                        real_photos_found += 1
            except Exception as e:
                print(f"  Error: {e}")

        if embedding is None:
            # Use deterministic embedding based on celeb_id hash
            np.random.seed(hash(celeb_id) % (2**32))
            embedding = np.random.randn(512).astype(np.float32)
            print(f"  Using placeholder embedding (need real photo)")

        celebrity_db[celeb_id] = {
            "name": data["name"],
            "name_uz": data["name_uz"],
            "category": data["category"],
            "image": f"/celebrities/{celeb_id}.jpg",
            "embedding": embedding
        }

    with open(db_path, 'wb') as f:
        pickle.dump(celebrity_db, f)

    print(f"\n=== Database saved ===")
    print(f"Total celebrities: {len(celebrity_db)}")
    print(f"Real photos found: {real_photos_found}")

    if real_photos_found < len(celebrity_db):
        print(f"\n!!! Need {len(celebrity_db) - real_photos_found} more real photos !!!")
        print(f"Put photos in: {celebrities_path}")
        print("Required files:")
        for celeb_id in CELEBRITIES:
            print(f"  - {celeb_id}.jpg")


if __name__ == "__main__":
    build_database()
