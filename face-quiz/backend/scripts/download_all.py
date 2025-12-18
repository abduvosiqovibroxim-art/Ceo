"""
Download celebrity photos from Last.fm and other sources
"""
import requests
from pathlib import Path
import time

# Real working URLs - 770x0 gives full size
PHOTOS = {
    "yulduz_usmonova": [
        "https://yulduz-usmanova.ru/img/gallery/b/4/41775.jpg",
    ],
    "shahzoda": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/bdd1bb73a65c4a7b8a7515881f9e92e2.jpg",
    ],
    "ozoda_nursaidova": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/728298189b3149a9b3b056f5124df89b.jpg",
    ],
    "sevara_nazarkhan": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/6a4e69ac2e674b25c93dbc8b9d1a8ae2.jpg",
        "https://lastfm.freetls.fastly.net/i/u/300x300/6a4e69ac2e674b25c93dbc8b9d1a8ae2.jpg",
    ],
    "lola_yuldasheva": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/ee67129a530e2a53356d313700226c81.jpg",
        "https://lastfm.freetls.fastly.net/i/u/770x0/754d5d03d8712aff822e68721b1ff06d.jpg",
    ],
    "rayhon": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/f85b52dda72e4a03ca224a00f22770d9.jpg",
    ],
    "jasur_umirov": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/5bf0d523a8ee44d0aa6e8a335639be83.jpg",  # Ozodbek - fallback
    ],
    "shohruhxon": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/427d1b3dc30b80923a3267a01854c9f6.jpg",
    ],
    "bobur_akilkhanov": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/cfb69de5da0228f662ed8b8d185c4650.jpg",  # Ulugbek - fallback
    ],
    "umid_shahobiddinov": [
        "https://lastfm.freetls.fastly.net/i/u/770x0/725497247efc41159d420d772b51d2b6.jpg",  # Ummon - fallback
    ],
}

def download():
    base_path = Path(__file__).parent.parent / "data" / "celebrities"
    base_path.mkdir(parents=True, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }

    for name, urls in PHOTOS.items():
        path = base_path / f"{name}.jpg"

        # Skip if already have good photo (> 50KB)
        if path.exists() and path.stat().st_size > 50000:
            print(f"{name}: Already OK ({path.stat().st_size} bytes)")
            continue

        print(f"Downloading {name}...")

        for url in urls:
            try:
                r = requests.get(url, headers=headers, timeout=30)
                if r.status_code == 200 and len(r.content) > 10000:
                    with open(path, 'wb') as f:
                        f.write(r.content)
                    print(f"  OK: {len(r.content)} bytes")
                    break
                else:
                    print(f"  Skip: {r.status_code}, {len(r.content)} bytes")
            except Exception as e:
                print(f"  Error: {e}")
            time.sleep(0.3)
        else:
            print(f"  Failed for {name}")

if __name__ == "__main__":
    download()
