"""JSON-LD recipe extraction from HTML pages."""

import json
import re

from bs4 import BeautifulSoup
import structlog

from ..models import ExtractedRecipe, ExtractedIngredient, ExtractedStep, IngredientCategory

log = structlog.get_logger()


def extract_jsonld_recipe(html: str) -> dict | None:
    """Extract schema.org/Recipe JSON-LD data from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, TypeError):
            continue

        recipe = _find_recipe_in_jsonld(data)
        if recipe:
            return recipe

    return None


def _find_recipe_in_jsonld(data: dict | list) -> dict | None:
    """Recursively search JSON-LD data for a Recipe type."""
    if isinstance(data, list):
        for item in data:
            result = _find_recipe_in_jsonld(item)
            if result:
                return result
        return None

    if isinstance(data, dict):
        schema_type = data.get("@type", "")
        # @type can be a string or list
        types = schema_type if isinstance(schema_type, list) else [schema_type]
        if "Recipe" in types:
            return data

        # Check @graph arrays
        if "@graph" in data:
            return _find_recipe_in_jsonld(data["@graph"])

    return None


def parse_iso_duration(duration: str | None) -> int | None:
    """Parse ISO 8601 duration string to minutes. PT30M→30, PT1H15M→75."""
    if not duration:
        return None

    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
    if not match:
        return None

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    total = hours * 60 + minutes + (1 if seconds >= 30 else 0)
    return total if total > 0 else None


def _parse_yield(recipe_yield: str | list | int | None) -> int:
    """Parse recipeYield to an integer servings count."""
    if isinstance(recipe_yield, int):
        return recipe_yield
    if isinstance(recipe_yield, list):
        recipe_yield = recipe_yield[0] if recipe_yield else "4"
    if isinstance(recipe_yield, str):
        match = re.search(r"(\d+)", recipe_yield)
        if match:
            return int(match.group(1))
    return 4


def _parse_ingredient_line(line: str) -> ExtractedIngredient:
    """Best-effort parse of an ingredient display string."""
    # Try to extract a leading quantity and unit
    match = re.match(
        r"^([\d./½¼¾⅓⅔⅛]+(?:\s*[-–]\s*[\d./½¼¾⅓⅔⅛]+)?)\s*"
        r"(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|"
        r"grams?|g|kg|ml|liters?|cloves?|cans?|cups?|pinch(?:es)?|whole|large|medium|small|pieces?)?\s*"
        r"(.*)",
        line,
        re.IGNORECASE,
    )

    if match:
        qty_str = match.group(1).strip()
        unit = (match.group(2) or "whole").strip().lower()
        rest = match.group(3).strip()
        try:
            # Handle fractions like "1/2"
            qty = float(eval(qty_str.replace("½", "0.5").replace("¼", "0.25")  # noqa: S307
                              .replace("¾", "0.75").replace("⅓", "0.333")
                              .replace("⅔", "0.667").replace("⅛", "0.125")))
        except Exception:
            qty = 1.0
    else:
        qty = 1.0
        unit = "whole"
        rest = line

    return ExtractedIngredient(
        quantity=qty,
        unit=unit,
        ingredient=rest or line,
        category=IngredientCategory.OTHER,
        display_text=line,
    )


def _parse_instructions(instructions: str | list | None) -> list[ExtractedStep]:
    """Parse recipeInstructions into steps."""
    if not instructions:
        return []

    steps: list[ExtractedStep] = []

    if isinstance(instructions, str):
        # Split on numbered patterns or newlines
        lines = [l.strip() for l in re.split(r"\n+", instructions) if l.strip()]
        for i, line in enumerate(lines, 1):
            # Strip leading step numbers like "1." or "Step 1:"
            clean = re.sub(r"^(?:step\s*)?\d+[.:)]\s*", "", line, flags=re.IGNORECASE)
            if clean:
                steps.append(ExtractedStep(step_number=i, instruction=clean))
        return steps

    if isinstance(instructions, list):
        for i, item in enumerate(instructions, 1):
            if isinstance(item, str):
                steps.append(ExtractedStep(step_number=i, instruction=item))
            elif isinstance(item, dict):
                text = item.get("text", item.get("name", ""))
                if text:
                    steps.append(ExtractedStep(step_number=i, instruction=text))

    return steps


def _parse_tags(data: dict) -> list[str]:
    """Extract tags from JSON-LD recipe fields."""
    tags: list[str] = []

    for field in ("keywords", "recipeCategory", "recipeCuisine"):
        value = data.get(field)
        if isinstance(value, str):
            tags.extend(t.strip().lower() for t in value.split(",") if t.strip())
        elif isinstance(value, list):
            tags.extend(str(t).strip().lower() for t in value if t)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for tag in tags:
        if tag not in seen:
            seen.add(tag)
            unique.append(tag)

    return unique[:10]


def map_jsonld_to_recipe(data: dict) -> ExtractedRecipe:
    """Map schema.org/Recipe JSON-LD to ExtractedRecipe."""
    ingredients_raw = data.get("recipeIngredient", [])
    ingredients = [_parse_ingredient_line(line) for line in ingredients_raw if line]

    steps = _parse_instructions(data.get("recipeInstructions"))
    tags = _parse_tags(data)

    return ExtractedRecipe(
        title=data.get("name", "Untitled Recipe"),
        description=data.get("description"),
        servings=_parse_yield(data.get("recipeYield")),
        prep_time_minutes=parse_iso_duration(data.get("prepTime")),
        cook_time_minutes=parse_iso_duration(data.get("cookTime")),
        ingredients=ingredients,
        steps=steps,
        tags=tags,
        confidence_score=0.8,
    )
