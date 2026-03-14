"""Main entry point for the ingestion worker."""

import asyncio
import os
import signal
import structlog

from . import db
from . import llm
from .worker import IngestionWorker

log = structlog.get_logger()


async def main() -> None:
    """Main entry point."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    database_url = os.getenv("DATABASE_URL")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is required")

    # Initialize services
    await db.connect(database_url)
    llm.init(openai_api_key)

    worker = IngestionWorker(redis_url)

    # Handle shutdown signals
    loop = asyncio.get_event_loop()

    def shutdown_handler() -> None:
        log.info("Received shutdown signal")
        asyncio.create_task(worker.stop())
        asyncio.create_task(db.disconnect())

    if os.name != "nt":
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, shutdown_handler)

    log.info("Starting ingestion worker", redis_url=redis_url)
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
