import logging
from datetime import datetime, timezone
from temporalio import activity
from database import brews_collection, users_collection

logger = activity.logger

@activity.defn
async def update_brew_ready_activity(params: dict) -> dict:
    """
    Update MongoDB: Set brew status to 'ready' and attach loot details.
    Also increments user's consistency_score.
    """
    brew_id = params.get("brew_id")
    player_id = params.get("player_id")
    loot = params.get("loot", {})

    logger.info(f"Setting brew {brew_id} to 'ready' with loot: {loot.get('item_name')}")

    update_doc = {
        "$set": {
            "status": "ready",
            "loot": loot,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
    }

    await brews_collection.update_one({"brew_id": brew_id}, update_doc)
    logger.info(f"Brew update completed for {brew_id}.")

    # Increment player's consistency score for completing the brew
    try:
        await users_collection.update_one(
            {"player_id": player_id},
            {"$inc": {"consistency_score": 1}},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"Could not increment consistency_score: {e}")

    return {"status": "ready", "brew_id": brew_id}
