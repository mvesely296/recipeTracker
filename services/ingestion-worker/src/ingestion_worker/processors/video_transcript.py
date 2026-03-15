"""YouTube video transcript processing."""

import asyncio
import re
from typing import Any

import structlog

from .. import db
from ..llm import structure_recipe_from_text
from ..models import ExtractedRecipe

log = structlog.get_logger()


def _extract_youtube_video_id(url: str) -> str | None:
    """Extract YouTube video ID from various URL formats."""
    match = re.search(r"(?:v=|youtu\.be/|/embed/|/v/|/shorts/)([a-zA-Z0-9_-]{11})", url)
    return match.group(1) if match else None


async def _fetch_transcript(video_id: str) -> str:
    """Fetch YouTube transcript using youtube-transcript-api."""
    from youtube_transcript_api import YouTubeTranscriptApi

    def _get() -> str:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        return " ".join(snippet.text for snippet in transcript)

    # youtube-transcript-api is synchronous, run in thread
    return await asyncio.to_thread(_get)


async def process_video(job: dict[str, Any]) -> ExtractedRecipe:
    """Process a YouTube video to extract recipe from transcript."""
    source_url = job.get("source_url", "")
    job_id = job.get("id", "")
    user_id = job.get("user_id", "")

    log.info("Processing video", source_url=source_url)

    video_id = _extract_youtube_video_id(source_url)
    if not video_id:
        raise ValueError(f"Could not extract YouTube video ID from URL: {source_url}")

    transcript_text = await _fetch_transcript(video_id)
    if not transcript_text:
        raise ValueError(f"No transcript available for video: {video_id}")

    # Store transcript as artifact
    await db.insert_artifact(
        job_id, "transcript", transcript_text, {"video_id": video_id, "url": source_url}
    )

    # Structure via LLM
    recipe = await structure_recipe_from_text(
        transcript_text, "YouTube cooking video transcript"
    )
    recipe.confidence_score = 0.5

    # Store extracted draft
    await db.insert_artifact(
        job_id, "extracted_draft", recipe.model_dump_json(), {"source": "youtube_llm"}
    )

    # Insert recipe into database
    title_override = job.get("title")
    recipe_id = await db.insert_recipe(user_id, recipe, "youtube", source_url, job_id, title_override=title_override)
    log.info("Recipe created from YouTube", recipe_id=recipe_id, title=recipe.title)

    return recipe
