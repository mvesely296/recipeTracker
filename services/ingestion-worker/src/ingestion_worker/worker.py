"""Worker implementation for processing ingestion jobs."""

import asyncio
import json
from typing import Any

import redis.asyncio as redis
import structlog

from . import db
from .processors.ocr import process_ocr
from .processors.video_transcript import process_video
from .processors.recipe_extractor import extract_recipe

log = structlog.get_logger()


class IngestionWorker:
    """Worker for processing recipe ingestion jobs."""

    def __init__(self, redis_url: str) -> None:
        self.redis_url = redis_url
        self.redis: redis.Redis | None = None
        self.running = False

    async def start(self) -> None:
        """Start the worker."""
        self.redis = redis.from_url(self.redis_url)
        self.running = True

        log.info("Ingestion worker started")

        while self.running:
            try:
                # Block waiting for jobs from the ingestion queue
                result = await self.redis.blpop("ingestion:jobs", timeout=5)

                if result:
                    _, job_data = result
                    await self.process_job(json.loads(job_data))
            except redis.ConnectionError:
                log.error("Redis connection error, retrying...")
                await asyncio.sleep(5)
            except Exception as e:
                log.error("Error processing job", error=str(e))
                await asyncio.sleep(1)

    async def stop(self) -> None:
        """Stop the worker."""
        self.running = False
        if self.redis:
            await self.redis.close()
        log.info("Ingestion worker stopped")

    async def process_job(self, job: dict[str, Any]) -> None:
        """Process a single ingestion job."""
        job_id = job.get("id")
        job_type = job.get("source_type")

        log.info("Processing job", job_id=job_id, job_type=job_type)

        try:
            # Mark job as processing
            if job_id:
                await db.update_job_status(job_id, "processing")

            match job_type:
                case "image":
                    await process_ocr(job)
                case "youtube" | "instagram":
                    await process_video(job)
                case "url":
                    await extract_recipe(job)
                case _:
                    raise ValueError(f"Unknown job type: {job_type}")

            log.info("Job completed", job_id=job_id)
        except Exception as e:
            log.error("Job failed", job_id=job_id, error=str(e))
            if job_id:
                await db.update_job_status(job_id, "failed", error_message=str(e))
