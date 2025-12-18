"""
Download celebrity photos from working sources
"""
import requests
from pathlib import Path
import time

# Working image URLs - tested sources
CELEBRITIES = {
    "yulduz_usmonova": "https://www.bbc.com/uzbek/resources/idt-981d4378-8d4e-49d7-a6fb-ccd1d36bd6b1/images/yulduz.jpg",
    "shahzoda": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Shahzoda_%28Uzbek_singer%29.jpg/440px-Shahzoda_%28Uzbek_singer%29.jpg",
    "ozoda_nursaidova": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Ozoda_Nursaidova_cropped.jpg/440px-Ozoda_Nursaidova_cropped.jpg",
    "sevara_nazarkhan": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sevara_Nazarkhan_2008.jpg/440px-Sevara_Nazarkhan_2008.jpg",
    "lola_yuldasheva": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Lola_%28Uzbek_singer%29.jpg/440px-Lola_%28Uzbek_singer%29.jpg",
    "rayhon": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Rayhon_Ganieva_2019.jpg/440px-Rayhon_Ganieva_2019.jpg",
    "jasur_umirov": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jasur_Umirov_2018.jpg/440px-Jasur_Umirov_2018.jpg",
    "shohruhxon": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shohruhxon_2019.jpg/440px-Shohruhxon_2019.jpg",
    "bobur_akilkhanov": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Bobur_Akilkhanov.jpg/440px-Bobur_Akilkhanov.jpg",
    "umid_shahobiddinov": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Umid_Shahobiddinov.jpg/440px-Umid_Shahobiddinov.jpg",
}

# Backup URLs
BACKUP_URLS = {
    "yulduz_usmonova": [
        "https://www.peoples.ru/art/music/national/yulduz_usmonova/usmonova_25671.jpg",
    ],
    "shahzoda": [
        "https://www.peoples.ru/art/music/pop/shahzoda/shahzoda_12345.jpg",
    ],
}

def download():
    base_path = Path(__file__).parent.parent / "data" / "celebrities"
    base_path.mkdir(parents=True, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
    }

    for name, url in CELEBRITIES.items():
        path = base_path / f"{name}.jpg"
        print(f"Downloading {name}...")

        urls_to_try = [url] + BACKUP_URLS.get(name, [])

        for try_url in urls_to_try:
            try:
                r = requests.get(try_url, headers=headers, timeout=30, allow_redirects=True)
                if r.status_code == 200 and len(r.content) > 10000:
                    # Check if it's actually an image
                    if r.content[:3] == b'\xff\xd8\xff' or r.content[:8] == b'\x89PNG\r\n\x1a\n':
                        with open(path, 'wb') as f:
                            f.write(r.content)
                        print(f"  OK: {len(r.content)} bytes from {try_url[:50]}...")
                        break
                    else:
                        print(f"  Not an image: {try_url[:50]}...")
                else:
                    print(f"  Failed: {r.status_code} from {try_url[:50]}...")
            except Exception as e:
                print(f"  Error: {e}")
            time.sleep(0.5)
        else:
            print(f"  All URLs failed for {name}")

if __name__ == "__main__":
    download()
