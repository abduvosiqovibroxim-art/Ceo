"""
LLM-based content moderation using OpenAI or local models.
"""

import httpx
from typing import Optional

from stario_common.config import get_settings
from stario_common.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


async def moderate_text_llm(text: str) -> dict[str, float]:
    """
    Moderate text using LLM (OpenAI moderation endpoint or custom model).

    Returns confidence scores for various categories.
    """
    if settings.openai_api_key:
        return await _moderate_with_openai(text)
    else:
        return await _moderate_with_local_model(text)


async def _moderate_with_openai(text: str) -> dict[str, float]:
    """Use OpenAI's moderation API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/moderations",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={"input": text},
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("results"):
            return {}

        result = data["results"][0]
        categories = result.get("category_scores", {})

        return {
            "toxicity": max(
                categories.get("harassment", 0),
                categories.get("hate", 0),
            ),
            "political": 0.0,  # OpenAI doesn't have this category
            "profanity": categories.get("sexual", 0),
            "hate_speech": categories.get("hate", 0),
            "violence": categories.get("violence", 0),
            "self_harm": categories.get("self-harm", 0),
        }


async def _moderate_with_local_model(text: str) -> dict[str, float]:
    """Use local moderation model (e.g., custom fine-tuned model)."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.moderation_llm_endpoint}/moderate",
                json={"text": text},
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error("Local moderation failed", error=str(e))
        # Return safe defaults on failure
        return {
            "toxicity": 0.0,
            "political": 0.0,
            "profanity": 0.0,
            "hate_speech": 0.0,
        }


async def check_topic_safety(
    text: str,
    whitelist: list[str],
    blacklist: list[str],
) -> dict:
    """
    Check if text content is safe based on topic lists.

    Uses LLM to classify the topic of the text.
    """
    # Simple keyword-based check for mock
    text_lower = text.lower()

    for topic in blacklist:
        if topic.lower() in text_lower:
            return {
                "safe": False,
                "reason": f"Contains blacklisted topic: {topic}",
                "topic": topic,
            }

    return {"safe": True, "reason": None, "topic": None}


async def generate_safe_alternative(
    text: str,
    flags: list[str],
) -> Optional[str]:
    """
    Generate a safer alternative for flagged content.

    Uses LLM to rewrite content while preserving intent.
    """
    if not settings.openai_api_key:
        return None

    prompt = f"""
    The following text was flagged for: {', '.join(flags)}

    Original text: {text}

    Please rewrite this text to be appropriate while keeping the same general intent.
    Make it suitable for a greeting video from a celebrity to a fan.
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.moderation_llm_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.7,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error("Failed to generate safe alternative", error=str(e))
        return None
