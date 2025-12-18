"""
Download real celebrity photos
"""
import requests
from pathlib import Path
import time

PHOTOS = {
    "yulduz_usmonova": [
        "https://yulduz-usmanova.ru/img/gallery/b/4/41775.jpg",
        "https://yulduz-usmanova.ru/img/gallery/b/6/63552.jpg",
        "https://yulduz-usmanova.ru/img/gallery/b/5/51338.jpg",
    ],
    "shahzoda": [
        "https://shahzoda.ru/img/gallery/b/1/10001.jpg",
        "https://shahzoda.ru/img/gallery/b/1/10002.jpg",
    ],
    "ozoda_nursaidova": [
        "https://ozoda.ru/img/gallery/b/1/10001.jpg",
    ],
    "sevara_nazarkhan": [
        "https://sevara.ru/img/gallery/b/1/10001.jpg",
    ],
    "lola_yuldasheva": [
        "https://lola.ru/img/gallery/b/1/10001.jpg",
    ],
    "rayhon": [
        "https://rayhon.ru/img/gallery/b/1/10001.jpg",
    ],
    "jasur_umirov": [
        "https://jasur-umirov.ru/img/gallery/b/1/10001.jpg",
    ],
    "shohruhxon": [
        "https://shohruhxon.ru/img/gallery/b/1/10001.jpg",
    ],
    "bobur_akilkhanov": [
        "https://bobur-akilkhanov.ru/img/gallery/b/1/10001.jpg",
    ],
    "umid_shahobiddinov": [
        "https://umid.ru/img/gallery/b/1/10001.jpg",
    ],
}

def download():
    base_path = Path(__file__).parent.parent / "data" / "celebrities"
    base_path.mkdir(parents=True, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    }

    for name, urls in PHOTOS.items():
        path = base_path / f"{name}.jpg"
        print(f"Downloading {name}...")

        for url in urls:
            try:
                r = requests.get(url, headers=headers, timeout=30)
                if r.status_code == 200 and len(r.content) > 10000:
                    if r.content[:3] == b'\xff\xd8\xff':
                        with open(path, 'wb') as f:
                            f.write(r.content)
                        print(f"  OK: {len(r.content)} bytes")
                        break
                else:
                    print(f"  Failed: {r.status_code}")
            except Exception as e:
                print(f"  Error: {e}")
            time.sleep(0.3)
        else:
            print(f"  All failed for {name}")

if __name__ == "__main__":
    download()
