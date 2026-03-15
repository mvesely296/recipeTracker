"""Recipe extraction from URLs."""

import re
from typing import Any

import httpx
from bs4 import BeautifulSoup
import structlog

from .. import db
from ..llm import structure_recipe_from_text
from ..models import ExtractedRecipe
from .jsonld import extract_jsonld_recipe, map_jsonld_to_recipe

log = structlog.get_logger()


def _strip_html_to_text(html: str) -> str:
    """Strip HTML to readable text, removing scripts/styles/nav/footer."""
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    # Collapse excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


async def extract_recipe(job: dict[str, Any]) -> ExtractedRecipe:
    """Extract recipe from a URL.

    Tries JSON-LD structured data first, falls back to LLM extraction.
    """
    source_url = job.get("source_url", "")
    job_id = job.get("id", "")
    user_id = job.get("user_id", "")

    log.info("Extracting recipe from URL", source_url=source_url)

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(source_url)
        response.raise_for_status()
        html_content = response.text

    # Store raw HTML as source artifact
    await db.insert_artifact(job_id, "source_media", html_content, {"url": source_url})

    # Try JSON-LD first
    jsonld_data = extract_jsonld_recipe(html_content)

    if jsonld_data:
        log.info("Found JSON-LD recipe data", source_url=source_url)
        recipe = map_jsonld_to_recipe(jsonld_data)
    else:
        log.info("No JSON-LD found, falling back to LLM", source_url=source_url)
        plain_text = _strip_html_to_text(html_content)
        # Truncate to ~8K tokens
        plain_text = plain_text[:32000]
        recipe = await structure_recipe_from_text(plain_text, "recipe webpage")
        recipe.confidence_score = 0.5

    # Store extracted draft
    await db.insert_artifact(
        job_id, "extracted_draft", recipe.model_dump_json(), {"source": "jsonld" if jsonld_data else "llm"}
    )

    # Insert recipe into database
    title_override = job.get("title")
    recipe_id = await db.insert_recipe(user_id, recipe, "url", source_url, job_id, title_override=title_override)
    log.info("Recipe created from URL", recipe_id=recipe_id, title=recipe.title)

    return recipe
