"""OCR processing for recipe images."""

from typing import Any

import structlog

log = structlog.get_logger()


async def process_ocr(job: dict[str, Any]) -> dict[str, Any]:
    """
    Process an image using OCR to extract recipe text.

    Args:
        job: Job data containing source_media_id or image URL

    Returns:
        Extracted text and structured recipe data
    """
    source_media_id = job.get("source_media_id")

    log.info("Processing OCR", source_media_id=source_media_id)

    # TODO: Implement actual OCR processing
    # 1. Download image from storage
    # 2. Run OCR (pytesseract or cloud service)
    # 3. Parse extracted text
    # 4. Structure into recipe format

    return {
        "status": "completed",
        "source_media_id": source_media_id,
        "extracted_text": "",  # TODO: Actual OCR result
        "structured_recipe": None,  # TODO: Parsed recipe
        "confidence_score": 0.0,
    }
