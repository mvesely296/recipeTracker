"""LLM-based recipe structuring service."""

import json

from openai import AsyncOpenAI
import structlog

from .models import ExtractedRecipe

log = structlog.get_logger()

_client: AsyncOpenAI | None = None


def init(api_key: str) -> None:
    """Initialize the OpenAI client."""
    global _client
    _client = AsyncOpenAI(api_key=api_key)


def _get_client() -> AsyncOpenAI:
    if _client is None:
        raise RuntimeError("OpenAI client not initialized. Call llm.init() first.")
    return _client


SYSTEM_PROMPT = """\
You are a recipe extraction assistant. Given raw text from a recipe source, \
extract a structured recipe with the following fields:

- title: The recipe name
- description: A brief 1-2 sentence description (optional)
- servings: Number of servings (integer, default 4)
- prep_time_minutes: Prep time in minutes (optional)
- cook_time_minutes: Cook time in minutes (optional)
- ingredients: List of ingredients, each with:
  - quantity: Numeric amount (float, e.g. 1.5)
  - unit: Unit of measurement (e.g. "cup", "tbsp", "lb", "whole" if no unit)
  - ingredient: Base ingredient name (e.g. "chicken breast")
  - attributes: Modifiers like "diced", "minced" (optional)
  - brand_candidate: Brand name if mentioned (optional)
  - category: One of: produce, meat, seafood, dairy, bakery, frozen, \
canned_goods, dry_goods, spices, condiments, beverages, snacks, other
  - display_text: The original ingredient line as written
- steps: Numbered cooking steps, each with:
  - step_number: 1-based integer
  - instruction: The step text
  - duration_minutes: Time for this step if mentioned (optional)
- tags: 3-8 tags covering cuisine (e.g. "italian"), meal type (e.g. "dinner"), \
dietary info (e.g. "vegetarian"), and cooking method (e.g. "baked")

Return ONLY valid JSON matching this schema. Do not include markdown formatting."""


async def structure_recipe_from_text(
    raw_text: str, source_context: str
) -> ExtractedRecipe:
    """Use an LLM to structure raw text into an ExtractedRecipe."""
    client = _get_client()

    # Truncate to ~8K tokens worth of text
    truncated = raw_text[:32000]

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Source: {source_context}\n\n{truncated}",
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    content = response.choices[0].message.content or "{}"
    data = json.loads(content)

    title = data.get("title", "")
    log.info("LLM extraction complete", title=title.encode("ascii", errors="replace").decode())
    return ExtractedRecipe.model_validate(data)


async def extract_text_from_image(image_data: bytes, media_type: str = "image/jpeg") -> str:
    """Use OpenAI Vision to extract text from a recipe image."""
    import base64

    client = _get_client()
    b64 = base64.b64encode(image_data).decode("utf-8")

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this recipe image exactly as written. "
                        "Include all ingredients, quantities, instructions, and any other text visible.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{b64}",
                        },
                    },
                ],
            }
        ],
        max_tokens=4096,
    )

    return response.choices[0].message.content or ""
