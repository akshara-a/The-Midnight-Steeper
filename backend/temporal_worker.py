import asyncio
import os
import logging
from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.worker import Worker

load_dotenv()

from workflows.brew_workflow import BrewWorkflow
from activities.tabpfn_ai import determine_rarity_activity
from activities.gemma_ai import generate_review_activity
from activities.elevenlabs_ai import generate_audio_activity
from activities.db_activities import update_brew_ready_activity

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("temporal_worker")

async def main():
    temporal_host = os.getenv("TEMPORAL_HOST", "").strip()
    task_queue = os.getenv("TEMPORAL_TASK_QUEUE", "MIDNIGHT_STEEPER_TASK_QUEUE").strip()

    if not temporal_host:
        logger.error("TEMPORAL_HOST environment variable is not defined.")
        return

    logger.info(f"Connecting to Temporal server at {temporal_host}...")
    client = await Client.connect(temporal_host)
    logger.info("Successfully connected to Temporal server.")

    worker = Worker(
        client,
        task_queue=task_queue,
        workflows=[BrewWorkflow],
        activities=[
            determine_rarity_activity,
            generate_review_activity,
            generate_audio_activity,
            update_brew_ready_activity
        ],
    )

    logger.info(f"Sloth Engine Worker initialized. Listening on task queue: '{task_queue}'")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
