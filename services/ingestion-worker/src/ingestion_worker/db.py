"""Database access layer for the ingestion worker."""

import json
import uuid
from typing import Any

import psycopg
from psycopg.rows import dict_row
import structlog

from .models import ExtractedRecipe

log = structlog.get_logger()

_pool: psycopg.AsyncConnection[Any] | None = None


async def connect(database_url: str) -> None:
    """Create a persistent database connection."""
    global _pool
    _pool = await psycopg.AsyncConnection.connect(database_url, row_factory=dict_row)
    log.info("Database connected")


async def disconnect() -> None:
    """Close the database connection."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        log.info("Database disconnected")


def _get_conn() -> psycopg.AsyncConnection[Any]:
    if _pool is None:
        raise RuntimeError("Database not connected. Call db.connect() first.")
    return _pool


async def update_job_status(
    job_id: str,
    status: str,
    error_message: str | None = None,
    recipe_id: str | None = None,
) -> None:
    """Update an ingestion job's status."""
    conn = _get_conn()
    sets = ["status = %(status)s"]
    params: dict[str, Any] = {"job_id": job_id, "status": status}

    if status == "processing":
        sets.append("started_at = now()")
    if status in ("completed", "failed"):
        sets.append("completed_at = now()")
    if error_message is not None:
        sets.append("error_message = %(error_message)s")
        params["error_message"] = error_message
    if recipe_id is not None:
        sets.append("recipe_id = %(recipe_id)s")
        params["recipe_id"] = recipe_id

    query = f"UPDATE ingestion_jobs SET {', '.join(sets)} WHERE id = %(job_id)s"
    await conn.execute(query, params)
    await conn.commit()
    log.info("Job status updated", job_id=job_id, status=status)


async def insert_artifact(
    job_id: str,
    artifact_type: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Insert an ingestion artifact and return its ID."""
    conn = _get_conn()
    artifact_id = str(uuid.uuid4())
    await conn.execute(
        """
        INSERT INTO ingestion_artifacts (id, job_id, artifact_type, content, metadata)
        VALUES (%(id)s, %(job_id)s, %(artifact_type)s, %(content)s, %(metadata)s)
        """,
        {
            "id": artifact_id,
            "job_id": job_id,
            "artifact_type": artifact_type,
            "content": content,
            "metadata": json.dumps(metadata) if metadata else None,
        },
    )
    await conn.commit()
    return artifact_id


async def insert_recipe(
    user_id: str,
    recipe: ExtractedRecipe,
    source_type: str,
    source_url: str | None,
    job_id: str,
) -> str:
    """Insert a complete recipe with ingredients, steps, and tags. Returns recipe ID."""
    conn = _get_conn()
    recipe_id = str(uuid.uuid4())

    async with conn.transaction():
        # Insert recipe
        await conn.execute(
            """
            INSERT INTO recipes (
                id, user_id, title, description, servings,
                prep_time_minutes, cook_time_minutes,
                source_type, source_url, confidence_score
            ) VALUES (
                %(id)s, %(user_id)s, %(title)s, %(description)s, %(servings)s,
                %(prep_time_minutes)s, %(cook_time_minutes)s,
                %(source_type)s, %(source_url)s, %(confidence_score)s
            )
            """,
            {
                "id": recipe_id,
                "user_id": user_id,
                "title": recipe.title,
                "description": recipe.description,
                "servings": recipe.servings,
                "prep_time_minutes": recipe.prep_time_minutes,
                "cook_time_minutes": recipe.cook_time_minutes,
                "source_type": source_type,
                "source_url": source_url,
                "confidence_score": recipe.confidence_score,
            },
        )

        # Insert ingredients
        for idx, ingredient in enumerate(recipe.ingredients):
            await conn.execute(
                """
                INSERT INTO recipe_ingredients (
                    id, recipe_id, order_index, quantity, unit, ingredient,
                    attributes, brand_candidate, category, display_text
                ) VALUES (
                    %(id)s, %(recipe_id)s, %(order_index)s, %(quantity)s, %(unit)s, %(ingredient)s,
                    %(attributes)s, %(brand_candidate)s, %(category)s, %(display_text)s
                )
                """,
                {
                    "id": str(uuid.uuid4()),
                    "recipe_id": recipe_id,
                    "order_index": idx,
                    "quantity": ingredient.quantity,
                    "unit": ingredient.unit,
                    "ingredient": ingredient.ingredient,
                    "attributes": ingredient.attributes,
                    "brand_candidate": ingredient.brand_candidate,
                    "category": ingredient.category.value,
                    "display_text": ingredient.display_text,
                },
            )

        # Insert steps
        for step in recipe.steps:
            await conn.execute(
                """
                INSERT INTO recipe_steps (
                    id, recipe_id, step_number, instruction, duration_minutes
                ) VALUES (
                    %(id)s, %(recipe_id)s, %(step_number)s, %(instruction)s, %(duration_minutes)s
                )
                """,
                {
                    "id": str(uuid.uuid4()),
                    "recipe_id": recipe_id,
                    "step_number": step.step_number,
                    "instruction": step.instruction,
                    "duration_minutes": step.duration_minutes,
                },
            )

        # Insert tags
        for tag in recipe.tags:
            await conn.execute(
                """
                INSERT INTO recipe_tags (id, recipe_id, tag)
                VALUES (%(id)s, %(recipe_id)s, %(tag)s)
                """,
                {
                    "id": str(uuid.uuid4()),
                    "recipe_id": recipe_id,
                    "tag": tag,
                },
            )

        # Link job to recipe
        await conn.execute(
            """
            UPDATE ingestion_jobs SET recipe_id = %(recipe_id)s, status = 'completed',
                   completed_at = now()
            WHERE id = %(job_id)s
            """,
            {"recipe_id": recipe_id, "job_id": job_id},
        )

    log.info("Recipe inserted", recipe_id=recipe_id, title=recipe.title)
    return recipe_id
