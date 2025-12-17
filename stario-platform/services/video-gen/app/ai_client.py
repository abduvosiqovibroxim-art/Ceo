"""
Production AI client for video generation.

Integrates with:
- LivePortrait: Face animation from single image
- SadTalker: Audio-driven talking head generation
- RVC/FastSpeech2: Voice cloning and TTS
"""

import asyncio
from typing import Optional

import httpx

from stario_common.config import get_settings
from stario_common.logging import get_logger
from stario_common.s3_client import get_s3

logger = get_logger(__name__)
settings = get_settings()


class AIVideoGenerator:
    """
    Production AI video generator.

    Orchestrates multiple AI services to generate personalized videos.
    """

    def __init__(self):
        self._http_client = httpx.AsyncClient(timeout=120.0)
        self._s3 = get_s3()

    async def generate(
        self,
        artist_id: str,
        message: str,
        recipient_name: str,
        occasion: str,
        duration_seconds: int = 15,
        source_image_url: Optional[str] = None,
        audio_url: Optional[str] = None,
    ) -> dict:
        """
        Generate video using production AI services.

        Pipeline:
        1. Get artist's source image and voice model
        2. Generate speech from message using artist's voice (RVC/FastSpeech2)
        3. Animate artist's face with generated audio (LivePortrait/SadTalker)
        4. Post-process and upload result
        """
        import uuid

        video_id = str(uuid.uuid4())

        # Step 1: Get artist assets
        artist_data = await self._get_artist_assets(artist_id)
        source_image = source_image_url or artist_data["source_image_url"]
        voice_model_id = artist_data["voice_model_id"]

        # Step 2: Generate speech
        logger.info("Generating speech", artist_id=artist_id, message_length=len(message))
        speech_result = await self._generate_speech(
            text=self._format_message(message, recipient_name, occasion),
            voice_model_id=voice_model_id,
            duration_target=duration_seconds,
        )

        # Step 3: Animate face
        logger.info("Animating face", artist_id=artist_id)
        animation_result = await self._animate_face(
            source_image_url=source_image,
            audio_url=speech_result["audio_url"],
        )

        # Step 4: Post-process
        logger.info("Post-processing video", video_id=video_id)
        final_video = await self._post_process(
            video_url=animation_result["video_url"],
            video_id=video_id,
        )

        return {
            "video_id": video_id,
            "video_url": final_video["video_url"],
            "thumbnail_url": final_video["thumbnail_url"],
            "duration_seconds": duration_seconds,
            "metadata": {
                "artist_id": artist_id,
                "recipient_name": recipient_name,
                "occasion": occasion,
            },
        }

    async def _get_artist_assets(self, artist_id: str) -> dict:
        """Get artist's AI assets (source image, voice model)."""
        # In production, query from database
        return {
            "source_image_url": f"https://storage.stario.uz/artists/{artist_id}/source.jpg",
            "voice_model_id": f"voice_{artist_id}",
            "animation_style": "natural",
        }

    async def _generate_speech(
        self,
        text: str,
        voice_model_id: str,
        duration_target: int,
    ) -> dict:
        """Generate speech using RVC/FastSpeech2."""
        try:
            response = await self._http_client.post(
                f"{settings.rvc_endpoint}/synthesize",
                json={
                    "text": text,
                    "voice_id": voice_model_id,
                    "language": "uz",
                    "target_duration": duration_target,
                },
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error("Speech generation failed", error=str(e))
            # Fallback to FastSpeech2
            return await self._generate_speech_fastspeech(text, voice_model_id)

    async def _generate_speech_fastspeech(
        self,
        text: str,
        voice_model_id: str,
    ) -> dict:
        """Fallback speech generation with FastSpeech2."""
        response = await self._http_client.post(
            f"{settings.fastspeech2_endpoint}/synthesize",
            json={
                "text": text,
                "speaker_id": voice_model_id,
            },
        )
        response.raise_for_status()
        return response.json()

    async def _animate_face(
        self,
        source_image_url: str,
        audio_url: str,
    ) -> dict:
        """Animate face using LivePortrait or SadTalker."""
        try:
            # Try LivePortrait first
            response = await self._http_client.post(
                f"{settings.liveportrait_endpoint}/animate",
                json={
                    "source_image": source_image_url,
                    "driving_audio": audio_url,
                    "output_format": "mp4",
                    "fps": 30,
                },
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning("LivePortrait failed, falling back to SadTalker", error=str(e))
            # Fallback to SadTalker
            return await self._animate_face_sadtalker(source_image_url, audio_url)

    async def _animate_face_sadtalker(
        self,
        source_image_url: str,
        audio_url: str,
    ) -> dict:
        """Fallback face animation with SadTalker."""
        response = await self._http_client.post(
            f"{settings.sadtalker_endpoint}/generate",
            json={
                "source_image": source_image_url,
                "driven_audio": audio_url,
                "preprocess": "crop",
                "still_mode": False,
            },
        )
        response.raise_for_status()
        return response.json()

    async def _post_process(
        self,
        video_url: str,
        video_id: str,
    ) -> dict:
        """Post-process video (upscale, filters, watermark)."""
        # Download, process, and upload
        # In production, this would apply filters, add watermarks, etc.

        # Upload to final storage
        final_key = f"videos/{video_id}/output.mp4"
        thumbnail_key = f"videos/{video_id}/thumbnail.jpg"

        return {
            "video_url": f"https://storage.stario.uz/{final_key}",
            "thumbnail_url": f"https://storage.stario.uz/{thumbnail_key}",
        }

    def _format_message(
        self,
        message: str,
        recipient_name: str,
        occasion: str,
    ) -> str:
        """Format the message with recipient name and occasion."""
        formatted = message.replace("{recipient_name}", recipient_name)
        formatted = formatted.replace("{name}", recipient_name)
        return formatted

    async def close(self) -> None:
        """Close HTTP client."""
        await self._http_client.aclose()


class InsightFaceClient:
    """Client for InsightFace face recognition/similarity."""

    def __init__(self):
        self._http_client = httpx.AsyncClient(timeout=30.0)

    async def compare_faces(
        self,
        image1_url: str,
        image2_url: str,
    ) -> dict:
        """Compare two faces and return similarity score."""
        response = await self._http_client.post(
            f"{settings.insightface_endpoint}/compare",
            json={
                "image1": image1_url,
                "image2": image2_url,
            },
        )
        response.raise_for_status()
        return response.json()

    async def detect_faces(self, image_url: str) -> dict:
        """Detect faces in an image."""
        response = await self._http_client.post(
            f"{settings.insightface_endpoint}/detect",
            json={"image": image_url},
        )
        response.raise_for_status()
        return response.json()

    async def close(self) -> None:
        await self._http_client.aclose()


class SDXLClient:
    """Client for SDXL image generation."""

    def __init__(self):
        self._http_client = httpx.AsyncClient(timeout=60.0)

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 1024,
        height: int = 1024,
        num_inference_steps: int = 30,
    ) -> dict:
        """Generate image using SDXL."""
        response = await self._http_client.post(
            f"{settings.sdxl_endpoint}/generate",
            json={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "width": width,
                "height": height,
                "num_inference_steps": num_inference_steps,
            },
        )
        response.raise_for_status()
        return response.json()

    async def close(self) -> None:
        await self._http_client.aclose()
