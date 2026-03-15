"""Instagram reel processing with 3-tier extraction: caption → audio → video frames."""

import asyncio
import base64
import re
import tempfile
from pathlib import Path
from typing import Any

import structlog

from .. import db
from ..llm import structure_recipe_from_text, _get_client
from ..models import ExtractedRecipe

log = structlog.get_logger()

# Heuristic: a caption that looks like a recipe
_RECIPE_KEYWORDS = re.compile(
    r"(ingredient|instruction|step\s*\d|direction|method|recipe|"
    r"\d+\s*(cup|tbsp|tsp|tablespoon|teaspoon|oz|lb|g\b|kg\b|ml\b|clove|pinch))",
    re.IGNORECASE,
)


def _caption_looks_like_recipe(caption: str) -> bool:
    """Check if an Instagram caption likely contains a recipe."""
    if len(caption) < 150:
        return False
    return bool(_RECIPE_KEYWORDS.search(caption))


async def _extract_metadata(url: str) -> dict[str, Any]:
    """Extract Instagram post metadata (caption, title) without downloading video."""
    import yt_dlp

    def _get_info() -> dict[str, Any]:
        opts = {"quiet": True, "no_warnings": True, "skip_download": True}
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=False) or {}

    return await asyncio.to_thread(_get_info)


async def _download_audio(url: str, output_dir: str) -> Path | None:
    """Download audio-only from Instagram reel. Returns path to audio file or None."""
    import yt_dlp

    audio_path = Path(output_dir) / "audio.%(ext)s"

    def _download() -> str | None:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "format": "bestaudio/best",
            "outtmpl": str(audio_path),
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "128",
                }
            ],
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
        except Exception:
            # FFmpeg may not be available — try without audio extraction
            opts_fallback = {
                "quiet": True,
                "no_warnings": True,
                "noprogress": True,
                "format": "bestaudio/best",
                "outtmpl": str(audio_path),
            }
            with yt_dlp.YoutubeDL(opts_fallback) as ydl:
                ydl.download([url])
        # Find the actual output file (extension may vary)
        for f in Path(output_dir).iterdir():
            if f.name.startswith("audio"):
                return str(f)
        return None

    result = await asyncio.to_thread(_download)
    return Path(result) if result else None


async def _download_video(url: str, output_dir: str) -> Path | None:
    """Download video from Instagram reel. Returns path to video file or None."""
    import yt_dlp

    video_path = Path(output_dir) / "video.%(ext)s"

    def _download() -> str | None:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "format": "best",
            "outtmpl": str(video_path),
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
        for f in Path(output_dir).iterdir():
            if f.name.startswith("video"):
                return str(f)
        return None

    result = await asyncio.to_thread(_download)
    return Path(result) if result else None


async def _transcribe_audio(audio_path: Path) -> str:
    """Transcribe audio file using OpenAI Whisper API."""
    client = _get_client()

    with open(audio_path, "rb") as f:
        response = await client.audio.transcriptions.create(model="whisper-1", file=f)
    return response.text


async def _extract_frames_text(video_path: Path) -> str:
    """Extract key frames from video and OCR them using GPT-4o-mini Vision."""
    import cv2

    def _sample_frames() -> list[bytes]:
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        # Sample every 2 seconds, cap at 10 frames
        interval = max(int(fps * 2), 1)
        frames: list[bytes] = []
        frame_idx = 0

        while cap.isOpened() and len(frames) < 10:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break
            # Encode as JPEG
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frames.append(buf.tobytes())
            frame_idx += interval

        cap.release()
        return frames

    frames = await asyncio.to_thread(_sample_frames)
    if not frames:
        return ""

    log.info("Extracted frames for OCR", count=len(frames))

    # Send frames to GPT-4o-mini Vision
    client = _get_client()
    content: list[dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                "These are frames from an Instagram cooking video. "
                "Extract ALL recipe text visible in any frame — ingredients with quantities, "
                "cooking instructions, recipe title, and any other recipe-related text. "
                "Combine text from all frames into one coherent recipe."
            ),
        }
    ]
    for frame_data in frames:
        b64 = base64.b64encode(frame_data).decode("utf-8")
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
            }
        )

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": content}],
        max_tokens=4096,
    )

    return response.choices[0].message.content or ""


def _recipe_is_valid(recipe: ExtractedRecipe) -> bool:
    """Check if an extracted recipe has enough content to be useful."""
    return len(recipe.ingredients) >= 2


async def process_instagram(job: dict[str, Any]) -> ExtractedRecipe:
    """Process an Instagram reel to extract a recipe.

    Three-tier pipeline:
      1. Caption text (free, instant)
      2. Audio transcription via Whisper (cheap)
      3. Video frame OCR via Vision (expensive, last resort)
    """
    source_url = job.get("source_url", "")
    job_id = job.get("id", "")
    user_id = job.get("user_id", "")
    title_override = job.get("title")

    log.info("Processing Instagram reel", source_url=source_url)

    with tempfile.TemporaryDirectory() as tmpdir:
        # --- Tier 1: Caption extraction ---
        log.info("Tier 1: Extracting caption", source_url=source_url)
        caption = ""
        try:
            metadata = await _extract_metadata(source_url)
            caption = metadata.get("description", "") or ""
            video_title = metadata.get("title", "")
        except Exception as e:
            log.warning("Failed to extract Instagram metadata", error=str(e))
            video_title = ""

        if caption:
            await db.insert_artifact(
                job_id,
                "source_media",
                caption,
                {"url": source_url, "platform": "instagram", "source": "caption"},
            )

        if _caption_looks_like_recipe(caption):
            log.info("Caption looks like a recipe, attempting extraction")
            try:
                recipe = await structure_recipe_from_text(caption, "Instagram post caption")
                recipe.confidence_score = 0.6
                if _recipe_is_valid(recipe):
                    log.info("Tier 1 succeeded: recipe from caption")
                    await db.insert_artifact(
                        job_id,
                        "extracted_draft",
                        recipe.model_dump_json(),
                        {"source": "instagram_caption"},
                    )
                    recipe_id = await db.insert_recipe(
                        user_id, recipe, "instagram", source_url, job_id,
                        title_override=title_override,
                    )
                    log.info("Recipe created from Instagram caption", recipe_id=recipe_id)
                    return recipe
            except Exception as e:
                log.warning("Caption extraction failed", error=str(e))

        # --- Tier 2: Audio transcription ---
        log.info("Tier 2: Attempting audio transcription", source_url=source_url)
        transcript = ""
        try:
            audio_path = await _download_audio(source_url, tmpdir)
            if audio_path and audio_path.exists():
                transcript = await _transcribe_audio(audio_path)
                if transcript:
                    await db.insert_artifact(
                        job_id,
                        "transcript",
                        transcript,
                        {"url": source_url, "platform": "instagram"},
                    )
        except Exception as e:
            log.warning("Audio transcription failed", error=str(e))

        if transcript and len(transcript.strip()) > 100:
            log.info("Transcript is substantive, attempting extraction")
            try:
                # Combine caption + transcript if both exist
                combined = transcript
                if caption:
                    combined = f"Post caption:\n{caption}\n\nSpoken narration:\n{transcript}"

                recipe = await structure_recipe_from_text(
                    combined, "Instagram cooking video narration"
                )
                recipe.confidence_score = 0.5
                if _recipe_is_valid(recipe):
                    log.info("Tier 2 succeeded: recipe from audio transcript")
                    await db.insert_artifact(
                        job_id,
                        "extracted_draft",
                        recipe.model_dump_json(),
                        {"source": "instagram_audio"},
                    )
                    recipe_id = await db.insert_recipe(
                        user_id, recipe, "instagram", source_url, job_id,
                        title_override=title_override,
                    )
                    log.info("Recipe created from Instagram audio", recipe_id=recipe_id)
                    return recipe
            except Exception as e:
                log.warning("Audio-based extraction failed", error=str(e))

        # --- Tier 3: Video frame OCR ---
        log.info("Tier 3: Attempting video frame OCR", source_url=source_url)
        try:
            video_path = await _download_video(source_url, tmpdir)
            if video_path and video_path.exists():
                frame_text = await _extract_frames_text(video_path)
                if frame_text:
                    await db.insert_artifact(
                        job_id,
                        "ocr_result",
                        frame_text,
                        {"url": source_url, "platform": "instagram"},
                    )

                    # Combine all available context
                    parts = []
                    if caption:
                        parts.append(f"Post caption:\n{caption}")
                    if transcript:
                        parts.append(f"Spoken narration:\n{transcript}")
                    parts.append(f"On-screen text from video:\n{frame_text}")
                    combined = "\n\n".join(parts)

                    recipe = await structure_recipe_from_text(
                        combined, "Instagram cooking video (combined sources)"
                    )
                    recipe.confidence_score = 0.4
                    if _recipe_is_valid(recipe):
                        log.info("Tier 3 succeeded: recipe from video frames")
                        await db.insert_artifact(
                            job_id,
                            "extracted_draft",
                            recipe.model_dump_json(),
                            {"source": "instagram_frames"},
                        )
                        recipe_id = await db.insert_recipe(
                            user_id, recipe, "instagram", source_url, job_id,
                            title_override=title_override,
                        )
                        log.info("Recipe created from Instagram frames", recipe_id=recipe_id)
                        return recipe
        except Exception as e:
            log.warning("Frame OCR extraction failed", error=str(e))

        raise ValueError(
            "Could not extract a recipe from this Instagram reel. "
            "The post may not contain a recipe, or it may require login to access."
        )
