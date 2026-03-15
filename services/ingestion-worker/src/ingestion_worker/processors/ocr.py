"""OCR processing for recipe images using OpenAI Vision."""

import os
from typing import Any

import httpx
import structlog

from .. import db
from ..llm import extract_text_from_image, structure_recipe_from_text
from ..models import ExtractedRecipe

log = structlog.get_logger()


async def _download_image(job: dict[str, Any]) -> tuple[bytes, str]:
    """Download image from Supabase storage or direct URL. Returns (data, media_type)."""
    source_media_id = job.get("source_media_id", "")
    source_url = job.get("source_url")

    async with httpx.AsyncClient(timeout=30.0) as client:
        if source_url:
            # Direct URL
            response = await client.get(source_url, follow_redirects=True)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "image/jpeg")
            return response.content, content_type

        # Supabase storage path
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")
        storage_url = f"{supabase_url}/storage/v1/object/{source_media_id}"

        response = await client.get(
            storage_url,
            headers={"Authorization": f"Bearer {supabase_key}"},
            follow_redirects=True,
        )
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/jpeg")
        return response.content, content_type


async def process_ocr(job: dict[str, Any]) -> ExtractedRecipe:
    """Process an image using OpenAI Vision to extract a recipe."""
    job_id = job.get("id", "")
    user_id = job.get("user_id", "")
    source_media_id = job.get("source_media_id", "")

    log.info("Processing OCR", source_media_id=source_media_id)

    # Download image
    image_data, media_type = await _download_image(job)

    # Extract text via OpenAI Vision
    ocr_text = await extract_text_from_image(image_data, media_type)
    if not ocr_text:
        raise ValueError("OCR extracted no text from image")

    # Store OCR result as artifact
    await db.insert_artifact(
        job_id, "ocr_result", ocr_text, {"source_media_id": source_media_id}
    )

    # Structure via LLM
    recipe = await structure_recipe_from_text(ocr_text, "OCR text from recipe photo")
    recipe.confidence_score = 0.4

    # Store extracted draft
    await db.insert_artifact(
        job_id, "extracted_draft", recipe.model_dump_json(), {"source": "ocr_llm"}
    )

    # Insert recipe into database
    title_override = job.get("title")
    recipe_id = await db.insert_recipe(user_id, recipe, "image", None, job_id, title_override=title_override)
    log.info("Recipe created from image", recipe_id=recipe_id, title=recipe.title)

    return recipe
