"""Main entry point for the ingestion worker."""

import asyncio
import os
import signal
import structlog

from .worker import IngestionWorker

log = structlog.get_logger()


async def main() -> None:
    """Main entry point."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    worker = IngestionWorker(redis_url)

    # Handle shutdown signals
    loop = asyncio.get_event_loop()

    def shutdown_handler() -> None:
        log.info("Received shutdown signal")
        asyncio.create_task(worker.stop())

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown_handler)

    log.info("Starting ingestion worker", redis_url=redis_url)
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
