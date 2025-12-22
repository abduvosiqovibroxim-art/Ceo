"""
AI Poster Maker API - Generates movie posters where user and celebrity appear TOGETHER
Uses Replicate API with IP-Adapter FaceID for face-preserving image generation
"""

import os
import uuid
import base64
import asyncio
import random
import logging
from pathlib import Path
from typing import Optional, Dict, List
from io import BytesIO

import httpx
import replicate
from fastapi import FastAPI, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Poster Maker API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
TEMP_DIR = BASE_DIR / "temp"
FONTS_DIR = BASE_DIR / "fonts"
CELEBRITIES_DIR = BASE_DIR / "celebrities"

for dir_path in [OUTPUT_DIR, TEMP_DIR, FONTS_DIR, CELEBRITIES_DIR]:
    dir_path.mkdir(exist_ok=True)

# Static files
app.mount("/static", StaticFiles(directory=str(OUTPUT_DIR)), name="static")
app.mount("/temp", StaticFiles(directory=str(TEMP_DIR)), name="temp")
app.mount("/celebrities", StaticFiles(directory=str(CELEBRITIES_DIR)), name="celebrities")

# Job tracking
jobs: Dict[str, Dict] = {}

# ============================================================================
# CELEBRITIES DATABASE
# ============================================================================

CELEBRITIES = {
    "yulduz_usmanova": {
        "name": "Юлдуз Усмонова",
        "name_uz": "Yulduz Usmonova",
        "folder": "Yulduz Usmanova"
    },
    "ozoda": {
        "name": "Озода",
        "name_uz": "Ozoda",
        "folder": "Ozoda"
    },
    "shahzoda": {
        "name": "Шахзода",
        "name_uz": "Shahzoda",
        "folder": "Shahzoda"
    },
    "sevara": {
        "name": "Севара",
        "name_uz": "Sevara",
        "folder": "Sevara"
    },
    "rayhon": {
        "name": "Райхон",
        "name_uz": "Rayhon",
        "folder": "Rayhon"
    },
    "ziyoda": {
        "name": "Зиёда",
        "name_uz": "Ziyoda",
        "folder": "Ziyoda"
    },
    "lola": {
        "name": "Лола",
        "name_uz": "Lola",
        "folder": "Lola"
    },
    "munisa_rizayeva": {
        "name": "Муниса Ризаева",
        "name_uz": "Munisa Rizayeva",
        "folder": "Munisa Rizayeva"
    },
    "tohir_sodiqov": {
        "name": "Тохир Содиков",
        "name_uz": "Tohir Sodiqov",
        "folder": "Tohir Sodiqov"
    },
    "jasur_umirov": {
        "name": "Жасур Умиров",
        "name_uz": "Jasur Umirov",
        "folder": "Jasur Umirov"
    },
    "dilsoz": {
        "name": "Дильсоз",
        "name_uz": "Dilsoz",
        "folder": "Dilsoz"
    },
    "ali_otajonov": {
        "name": "Али Отажонов",
        "name_uz": "Ali Otajonov",
        "folder": "Ali Otajonov"
    },
    "ozodbek_nazarbekov": {
        "name": "Озодбек Назарбеков",
        "name_uz": "Ozodbek Nazarbekov",
        "folder": "Ozodbek Nazarbekov"
    },
    "farukh_zakirov": {
        "name": "Фарух Закиров",
        "name_uz": "Farukh Zakirov",
        "folder": "Farukh Zakirov"
    },
    "jahongir_poziljonov": {
        "name": "Жахонгир Позилжонов",
        "name_uz": "Jahongir Poziljonov",
        "folder": "Jahondi Poziljonov"
    }
}

# ============================================================================
# STYLE PROMPTS FOR AI GENERATION
# ============================================================================

STYLE_PROMPTS = {
    "blockbuster": {
        "name": "Блокбастер",
        "name_uz": "Blokbaster",
        "prompt": "cinematic blockbuster movie poster, two people standing together heroically, dramatic explosion and fire background, action movie style, epic dramatic lighting, highly detailed faces looking at camera, professional movie poster composition, 8k uhd, movie title space at bottom",
        "negative": "cartoon, anime, blurry, bad anatomy, ugly, deformed faces, extra limbs, watermark, text, words",
        "titles": ["ПОСЛЕДНИЙ РУБЕЖ", "ТОЧКА НЕВОЗВРАТА", "ОГНЕННЫЙ ГОРОД", "МИССИЯ ВЫПОЛНИМА", "БЕЗ СТРАХА"]
    },
    "noir": {
        "name": "Нуар",
        "name_uz": "Nuar",
        "prompt": "film noir movie poster, man and woman in dramatic shadows, detective mystery style, high contrast black and white with subtle red accents, 1940s aesthetic, dramatic venetian blind shadows, both faces visible, mysterious atmosphere, cinematic composition",
        "negative": "colorful, bright, happy, cartoon, blurry, modern",
        "titles": ["ТЕНИ ПРОШЛОГО", "ЧЁРНАЯ ВДОВА", "ГОРОД ГРЕХОВ", "НОЧНОЙ ДЕТЕКТИВ", "РОКОВАЯ ЖЕНЩИНА"]
    },
    "neon": {
        "name": "Неон",
        "name_uz": "Neon",
        "prompt": "synthwave neon cyberpunk movie poster, two people together illuminated by neon lights, vibrant pink blue purple neon glow, futuristic city background, both faces clearly visible with neon reflections, vaporwave aesthetic, 8k cinematic",
        "negative": "daylight, natural lighting, old, vintage, blurry faces, realistic",
        "titles": ["НЕОНОВЫЕ НОЧИ", "КИБЕРПАНК", "ЭЛЕКТРО", "ГОЛОГРАММА", "ЦИФРОВАЯ ЛЮБОВЬ"]
    },
    "romance": {
        "name": "Романтика",
        "name_uz": "Romantika",
        "prompt": "romantic movie poster, loving couple embracing tenderly, beautiful golden hour sunset background, soft warm lighting, emotional tender moment, both faces clearly visible looking at each other or camera, professional photography style, 8k",
        "negative": "scary, dark, ugly, cartoon, action, violence, weapons",
        "titles": ["ЛЮБОВЬ БЕЗ ГРАНИЦ", "СЕРДЦЕ ПОМНИТ", "ВМЕСТЕ НАВСЕГДА", "СУДЬБА", "ПЕРВАЯ ЛЮБОВЬ"]
    },
    "drama": {
        "name": "Драма",
        "name_uz": "Drama",
        "prompt": "dramatic movie poster, two people with emotional expressions, moody atmospheric blue lighting, artistic cinematic composition, intense emotional scene, both faces in focus with dramatic shadows, award winning cinematography style, 8k",
        "negative": "happy, bright, cartoon, action, comedy, colorful",
        "titles": ["ИСПЫТАНИЕ", "ВЫБОР", "СУДЬБЫ", "РАЗЛУКА", "ПРОЩЕНИЕ"]
    },
    "action": {
        "name": "Боевик",
        "name_uz": "Jangari",
        "prompt": "action movie poster, two heroes standing back to back ready for battle, fire and explosions background, intense dramatic orange and teal lighting, determined powerful expressions, both faces visible, blockbuster action style, 8k cinematic",
        "negative": "peaceful, romantic, cartoon, blurry, soft, cute",
        "titles": ["ДВОЙНОЙ УДАР", "БЕЗ ПОЩАДЫ", "ОГНЕННЫЙ ШТОРМ", "ЯРОСТЬ", "ВОЗМЕЗДИЕ"]
    },
    "retro80": {
        "name": "Ретро 80-х",
        "name_uz": "Retro 80",
        "prompt": "1980s retro synthwave movie poster, two people in vintage 80s style, pink and blue gradient sunset sky, chrome and neon grid elements, VHS aesthetic scanlines, both faces visible, outrun retrowave style, nostalgic 80s movie poster, 8k",
        "negative": "modern, minimalist, realistic photo, dark horror, monochrome",
        "titles": ["СИНТВЕЙВ", "НАЗАД В 80-е", "РЕТРО ВОЛНА", "ТУРБО", "НЕОН"]
    },
    "netflix": {
        "name": "Netflix",
        "name_uz": "Netflix",
        "prompt": "Netflix original series poster style, dramatic close portrait of two faces, dark moody background with subtle red accent, professional studio lighting, intense eyes looking at camera, cinematic color grading, streaming series style, 8k portrait",
        "negative": "full body, action scene, bright colors, cartoon, old vintage",
        "titles": ["ЭЛИТА", "ТАЙНЫ", "КОРОНА", "ИГРА", "ВЛАСТЬ"]
    },
    "minimalism": {
        "name": "Минимализм",
        "name_uz": "Minimalizm",
        "prompt": "minimalist artistic movie poster, two people elegant silhouettes or simple stylized portraits, clean simple gradient background, elegant modern composition, artistic style, limited color palette, both figures visible, contemporary design, 8k",
        "negative": "busy, cluttered, realistic detailed, action explosions, text",
        "titles": ["ДВОЕ", "ТИШИНА", "МОМЕНТ", "ГРАНЬ", "СВЯЗЬ"]
    },
    "superhero": {
        "name": "Супергерой",
        "name_uz": "Superqahramon",
        "prompt": "superhero movie poster Marvel DC style, two superheroes in powerful heroic poses wearing capes, cosmic energy and dramatic light rays background, epic heroic lighting, both faces visible with determined expressions, comic book movie style, 8k cinematic",
        "negative": "realistic mundane, dark noir horror, blurry, bad anatomy",
        "titles": ["ГЕРОИ", "ЛИГА ЛЕГЕНД", "СИЛА ДВОИХ", "ЗАЩИТНИКИ", "СУПЕРСИЛА"]
    }
}


def get_celebrity_image_path(celebrity_id: str) -> Optional[str]:
    """Get path to celebrity image from face-quiz backend data"""
    if celebrity_id not in CELEBRITIES:
        return None

    celeb = CELEBRITIES[celebrity_id]
    folder = celeb["folder"]

    # Check in face-quiz backend celebrities folder
    face_quiz_path = Path("D:/Ibrokhim projects/Ceo/face-quiz/backend/data/celebrities") / folder

    if face_quiz_path.exists():
        images = list(face_quiz_path.glob("*.jpg")) + list(face_quiz_path.glob("*.png"))
        if images:
            return str(images[0])

    # Fallback to local celebrities folder
    local_path = CELEBRITIES_DIR / folder
    if local_path.exists():
        images = list(local_path.glob("*.jpg")) + list(local_path.glob("*.png"))
        if images:
            return str(images[0])

    return None


def image_to_data_uri(image_path: str) -> str:
    """Convert image file to data URI for Replicate API"""
    with open(image_path, "rb") as f:
        image_data = f.read()

    # Determine mime type
    if image_path.lower().endswith(".png"):
        mime = "image/png"
    else:
        mime = "image/jpeg"

    base64_data = base64.b64encode(image_data).decode("utf-8")
    return f"data:{mime};base64,{base64_data}"


def add_poster_text(image: Image.Image, style: str, celeb_name: str, custom_title: str = None) -> Image.Image:
    """Add movie poster text overlay"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    style_config = STYLE_PROMPTS.get(style, STYLE_PROMPTS["blockbuster"])

    # Choose title
    if custom_title:
        title = custom_title.upper()
    else:
        title = random.choice(style_config["titles"])

    # Load fonts
    try:
        font_title = ImageFont.truetype("arial.ttf", 56)
        font_subtitle = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = font_title
        font_small = font_title

    # Create gradient overlay at bottom
    gradient = Image.new('RGBA', (width, 280), (0, 0, 0, 0))
    for y in range(280):
        alpha = int(220 * (y / 280) ** 1.5)
        for x in range(width):
            gradient.putpixel((x, y), (0, 0, 0, alpha))

    # Convert to RGBA if needed
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    image.paste(gradient, (0, height - 280), gradient)
    draw = ImageDraw.Draw(image)

    # Title
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    title_y = height - 180

    # Shadow
    draw.text((title_x + 3, title_y + 3), title, font=font_title, fill=(0, 0, 0, 200))
    draw.text((title_x, title_y), title, font=font_title, fill="white")

    # Starring
    starring = f"В главных ролях: {celeb_name} и Вы"
    star_bbox = draw.textbbox((0, 0), starring, font=font_subtitle)
    star_width = star_bbox[2] - star_bbox[0]
    draw.text(((width - star_width) // 2, height - 110), starring, font=font_subtitle, fill=(220, 200, 160))

    # Coming soon
    soon = "СКОРО НА ВСЕХ ЭКРАНАХ"
    soon_bbox = draw.textbbox((0, 0), soon, font=font_small)
    soon_width = soon_bbox[2] - soon_bbox[0]
    draw.text(((width - soon_width) // 2, height - 70), soon, font=font_small, fill=(150, 150, 150))

    # Style badge at top
    badge = f"★ {style_config['name']} ★"
    badge_bbox = draw.textbbox((0, 0), badge, font=font_small)
    badge_width = badge_bbox[2] - badge_bbox[0]

    # Badge background
    badge_x = (width - badge_width) // 2
    draw.rectangle([(badge_x - 15, 15), (badge_x + badge_width + 15, 45)], fill=(0, 0, 0, 180))
    draw.text((badge_x, 20), badge, font=font_small, fill=(255, 200, 50))

    # Watermark
    draw.text((width - 100, height - 35), "stario.uz", font=font_small, fill=(100, 100, 100))

    return image.convert('RGB')


async def generate_with_replicate(
    user_image_path: str,
    celeb_image_path: str,
    style: str,
    job_id: str
) -> str:
    """Generate poster using Replicate API"""

    style_config = STYLE_PROMPTS.get(style, STYLE_PROMPTS["blockbuster"])

    # Convert images to data URIs
    user_data_uri = image_to_data_uri(user_image_path)
    celeb_data_uri = image_to_data_uri(celeb_image_path)

    jobs[job_id]["stage"] = "Генерация AI изображения..."
    jobs[job_id]["progress"] = 40

    try:
        # Use Replicate's face-to-many or similar model
        # Note: The exact model may vary - using a placeholder
        output = replicate.run(
            "lucataco/ip-adapter-faceid-plusv2-sdxl:049e91d6b0e6dc1b9d8dbc6c11a09c8eb62de88788f24ad4ea7e43069e24af8c",
            input={
                "prompt": style_config["prompt"],
                "negative_prompt": style_config["negative"],
                "face_image": user_data_uri,
                "face_image_2": celeb_data_uri,
                "width": 768,
                "height": 1024,
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "ip_adapter_scale": 0.8,
                "num_outputs": 1
            }
        )

        jobs[job_id]["stage"] = "Скачивание результата..."
        jobs[job_id]["progress"] = 70

        # Download result
        if output and len(output) > 0:
            result_url = output[0]
            async with httpx.AsyncClient() as client:
                response = await client.get(result_url)
                return response.content

        raise Exception("No output from Replicate")

    except replicate.exceptions.ReplicateError as e:
        logger.error(f"Replicate API error: {e}")
        raise


async def generate_poster_task(job_id: str, user_image_path: str, celebrity_id: str, style: str, custom_title: str = None):
    """Background task to generate poster"""
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["stage"] = "Подготовка..."
        jobs[job_id]["progress"] = 10

        # Get celebrity image
        celeb_image_path = get_celebrity_image_path(celebrity_id)
        if not celeb_image_path:
            raise Exception(f"Celebrity image not found: {celebrity_id}")

        celeb = CELEBRITIES[celebrity_id]
        style_config = STYLE_PROMPTS[style]

        jobs[job_id]["stage"] = "Загрузка изображений..."
        jobs[job_id]["progress"] = 20

        # Check if Replicate API token is set
        if not os.getenv("REPLICATE_API_TOKEN"):
            # Fallback: Create a simple composite poster without AI
            jobs[job_id]["stage"] = "Создание постера (без AI)..."
            result_image = create_fallback_poster(user_image_path, celeb_image_path, style)
        else:
            # Generate with Replicate
            result_bytes = await generate_with_replicate(
                user_image_path,
                celeb_image_path,
                style,
                job_id
            )
            result_image = Image.open(BytesIO(result_bytes)).convert("RGB")

        jobs[job_id]["stage"] = "Добавление текста..."
        jobs[job_id]["progress"] = 85

        # Add poster text
        result_image = add_poster_text(
            result_image,
            style,
            celeb["name"],
            custom_title
        )

        jobs[job_id]["stage"] = "Сохранение..."
        jobs[job_id]["progress"] = 95

        # Save result
        output_filename = f"{job_id}.jpg"
        output_path = OUTPUT_DIR / output_filename
        result_image.save(str(output_path), "JPEG", quality=95)

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["stage"] = "Готово!"
        jobs[job_id]["result_url"] = f"/static/{output_filename}"
        jobs[job_id]["title"] = custom_title or random.choice(style_config["titles"])

        logger.info(f"Poster generated: {output_path}")

    except Exception as e:
        logger.error(f"Generation error: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

    finally:
        # Cleanup temp file
        try:
            os.remove(user_image_path)
        except:
            pass


def create_fallback_poster(user_image_path: str, celeb_image_path: str, style: str) -> Image.Image:
    """Create a composite poster without AI (fallback when no API key)"""
    import cv2
    import numpy as np

    # Load images
    user_img = Image.open(user_image_path).convert("RGB")
    celeb_img = Image.open(celeb_image_path).convert("RGB")

    # Create poster canvas (768x1024)
    poster = Image.new("RGB", (768, 1024), (20, 20, 30))

    style_config = STYLE_PROMPTS.get(style, STYLE_PROMPTS["blockbuster"])

    # Resize and position faces
    # Make circular face crops
    def make_circular_crop(img, size):
        img = img.resize((size, size), Image.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        result.paste(img, mask=mask)
        return result

    face_size = 280
    user_face = make_circular_crop(user_img, face_size)
    celeb_face = make_circular_crop(celeb_img, face_size)

    # Position faces side by side
    poster.paste(celeb_face, (100, 300), user_face)
    poster.paste(user_face, (388, 300), celeb_face)

    # Apply style-specific color overlay
    overlay = Image.new("RGB", poster.size, (0, 0, 0))

    if style == "noir":
        poster = poster.convert("L").convert("RGB")
    elif style == "neon":
        # Add neon tint
        r, g, b = poster.split()
        r = r.point(lambda x: min(255, x + 30))
        b = b.point(lambda x: min(255, x + 50))
        poster = Image.merge("RGB", (r, g, b))
    elif style == "romance":
        # Warm tint
        r, g, b = poster.split()
        r = r.point(lambda x: min(255, x + 20))
        b = b.point(lambda x: max(0, x - 20))
        poster = Image.merge("RGB", (r, g, b))
    elif style == "retro80":
        # Pink/cyan tint
        r, g, b = poster.split()
        r = r.point(lambda x: min(255, x + 40))
        b = b.point(lambda x: min(255, x + 30))
        poster = Image.merge("RGB", (r, g, b))

    return poster


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    has_api_key = bool(os.getenv("REPLICATE_API_TOKEN"))
    return {
        "status": "healthy",
        "replicate_configured": has_api_key,
        "celebrities_count": len(CELEBRITIES),
        "styles_count": len(STYLE_PROMPTS)
    }


@app.get("/api/celebrities")
async def get_celebrities():
    """Get list of available celebrities"""
    result = []
    for celeb_id, celeb in CELEBRITIES.items():
        image_path = get_celebrity_image_path(celeb_id)
        if image_path:
            # Return relative path for frontend
            result.append({
                "id": celeb_id,
                "name": celeb["name"],
                "name_uz": celeb["name_uz"],
                "image": f"/celebrities/{Path(image_path).parent.name}/{Path(image_path).name}"
            })
    return {"celebrities": result, "total": len(result)}


@app.get("/api/styles")
async def get_styles():
    """Get list of available poster styles"""
    return {
        "styles": [
            {
                "id": style_id,
                "name": config["name"],
                "name_uz": config["name_uz"],
                "preview": f"/static/previews/{style_id}.jpg"
            }
            for style_id, config in STYLE_PROMPTS.items()
        ],
        "total": len(STYLE_PROMPTS)
    }


@app.post("/api/upload-face")
async def upload_face(file: UploadFile):
    """Upload user face photo"""
    face_id = str(uuid.uuid4())[:8]

    # Save file
    file_ext = Path(file.filename).suffix or ".jpg"
    temp_path = TEMP_DIR / f"{face_id}{file_ext}"

    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    # Validate it's an image
    try:
        img = Image.open(temp_path)
        img.verify()
    except Exception as e:
        os.remove(temp_path)
        raise HTTPException(400, "Invalid image file")

    return {
        "face_id": face_id,
        "preview_url": f"/temp/{face_id}{file_ext}",
        "message": "Фото загружено успешно"
    }


@app.post("/api/generate")
async def start_generation(
    background_tasks: BackgroundTasks,
    face_id: str = Form(...),
    celebrity_id: str = Form(...),
    style: str = Form(...),
    custom_title: str = Form(None)
):
    """Start poster generation"""

    # Validate inputs
    if celebrity_id not in CELEBRITIES:
        raise HTTPException(400, "Знаменитость не найдена")

    if style not in STYLE_PROMPTS:
        raise HTTPException(400, "Стиль не найден")

    # Find user image
    user_image_path = None
    for ext in [".jpg", ".jpeg", ".png"]:
        path = TEMP_DIR / f"{face_id}{ext}"
        if path.exists():
            user_image_path = str(path)
            break

    if not user_image_path:
        raise HTTPException(400, "Фото пользователя не найдено")

    # Create job
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "pending",
        "progress": 0,
        "stage": "В очереди...",
        "result_url": None,
        "error": None,
        "celebrity": CELEBRITIES[celebrity_id]["name"],
        "style": style
    }

    # Start background task
    background_tasks.add_task(
        generate_poster_task,
        job_id,
        user_image_path,
        celebrity_id,
        style,
        custom_title
    )

    return {
        "job_id": job_id,
        "status": "pending",
        "message": "Генерация началась"
    }


@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """Get generation job status"""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")

    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "stage": job.get("stage"),
        "result_url": job.get("result_url"),
        "error": job.get("error"),
        "title": job.get("title")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
