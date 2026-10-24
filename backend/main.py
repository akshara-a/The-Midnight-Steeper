import os
import uuid
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from temporalio.client import Client

from database import users_collection, brews_collection
from middleware import get_player_id
from workflows.brew_workflow import BrewWorkflow
from activities.tabpfn_ai import determine_rarity_activity
from activities.gemma_ai import generate_review_activity
from activities.db_activities import update_brew_ready_activity
from customers import (
    DURATION_TIERS,
    adjust_rarity,
    bonus_xp,
    customer_target,
    simulate_arrivals,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("main_api")

app = FastAPI(
    title="The Midnight Steeper Online API",
    version="1.1.0",
    description="Online zero-auth API for The Midnight Steeper"
)

# CORS configuration allowing online web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPORAL_HOST = os.getenv("TEMPORAL_HOST", "").strip()
TEMPORAL_TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "MIDNIGHT_STEEPER_TASK_QUEUE").strip()
BREW_DURATION_SECONDS = int(os.getenv("BREW_DURATION_SECONDS", "15"))

class BrewStartRequest(BaseModel):
    ingredients: List[str]
    duration_key: Optional[str] = None

async def get_temporal_client() -> Optional[Client]:
    if not TEMPORAL_HOST:
        return None
    try:
        return await Client.connect(TEMPORAL_HOST)
    except Exception as e:
        logger.info(f"Temporal server at {TEMPORAL_HOST} not detected ({e}). Using resilient cloud background engine.")
        return None

async def _resilient_cloud_steep_pipeline(
    brew_id: str,
    player_id: str,
    ingredients: List[str],
    duration_seconds: int,
    customers_served: int = 0,
    customers_target: int = 0
):
    """
    Resilient cloud background task.
    Executes if Temporal cluster is not actively paired in cloud environments,
    ensuring online players always receive their completed brew.
    """
    logger.info(f"Resilient steep pipeline active for brew {brew_id} ({duration_seconds}s timer)...")
    await asyncio.sleep(duration_seconds)
    logger.info(f"Steep complete for {brew_id}. Generating AI loot...")

    try:
        base_rarity = await determine_rarity_activity(player_id, ingredients, duration_seconds, brew_id)
        rarity = adjust_rarity(base_rarity, customers_served, customers_target)
        review = await generate_review_activity(rarity, ingredients, brew_id)

        tea_name = f"{rarity} {' & '.join(ingredients)} Infusion"
        loot = {
            "rarity": rarity,
            "item_name": tea_name,
            "review": review,
            "ingredients": ingredients,
            "base_rarity": base_rarity,
            "customers_served": customers_served,
            "customers_target": customers_target,
            "quota_met": customers_served >= customers_target,
            "bonus_xp": bonus_xp(customers_served, customers_target)
        }

        await update_brew_ready_activity({
            "brew_id": brew_id,
            "player_id": player_id,
            "loot": loot
        })
        logger.info(f"Brew {brew_id} successfully finalized in database.")
    except Exception as e:
        logger.error(f"Error executing resilient cloud pipeline: {e}")

@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "online",
        "game": "The Midnight Steeper",
        "mode": "Zero-Auth Cloud Engine"
    }

@app.get("/api/me")
async def get_me(player_id: str = Depends(get_player_id)):
    """
    Zero-Auth player session fetch.
    Returns or auto-initializes player profile for this local session.
    """
    user = await users_collection.find_one({"player_id": player_id}, {"_id": 0})
    if not user:
        user = {
            "player_id": player_id,
            "consistency_score": 1,
            "inventory": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await users_collection.insert_one(user)
        user.pop("_id", None)
        logger.info(f"Created new online local session: {player_id}")
    return user

@app.get("/api/brew/current")
async def get_current_brew(player_id: str = Depends(get_player_id)):
    """
    Query active brew for current local session.
    """
    brew = await brews_collection.find_one(
        {"player_id": player_id, "status": {"$ne": "claimed"}},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    return {"brew": brew}

@app.post("/api/brew/start")
async def start_brew(
    request: BrewStartRequest,
    player_id: str = Depends(get_player_id)
):
    """
    Start brewing process. Dispatches Temporal workflow or cloud async worker.
    """
    active_brew = await brews_collection.find_one(
        {"player_id": player_id, "status": {"$in": ["brewing", "ready"]}},
        {"_id": 0}
    )
    if active_brew:
        return {"message": "A brew is already in progress.", "brew": active_brew}

    if request.duration_key is not None and request.duration_key not in DURATION_TIERS:
        raise HTTPException(status_code=400, detail="Unknown steep duration.")
    duration_seconds = (
        DURATION_TIERS[request.duration_key][0] if request.duration_key else BREW_DURATION_SECONDS
    )

    user = await users_collection.find_one({"player_id": player_id}, {"_id": 0})
    streak = (user or {}).get("consistency_score", 1)

    brew_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    ready_time = (now + timedelta(seconds=duration_seconds)).isoformat()
    target = customer_target(request.duration_key, request.ingredients)
    arrivals = simulate_arrivals(brew_id, duration_seconds, target, request.ingredients, streak)

    brew_doc = {
        "brew_id": brew_id,
        "player_id": player_id,
        "ingredients": request.ingredients,
        "status": "brewing",
        "created_at": now.isoformat(),
        "ready_time": ready_time,
        "duration_seconds": duration_seconds,
        "duration_key": request.duration_key,
        "customers_target": target,
        "customer_arrivals": arrivals,
        "streak": streak,
        "loot": None
    }
    await brews_collection.insert_one(brew_doc)
    brew_doc.pop("_id", None)
    logger.info(f"Brew {brew_id} started for session {player_id}. Ready: {ready_time}")

    # Dispatch Temporal workflow asynchronously if server connected; otherwise resilient cloud task
    temporal_client = await get_temporal_client()
    if temporal_client:
        try:
            workflow_id = f"brew-workflow-{brew_id}"
            await temporal_client.start_workflow(
                BrewWorkflow.run,
                brew_id,
                player_id,
                request.ingredients,
                duration_seconds,
                len(arrivals),
                target,
                id=workflow_id,
                task_queue=TEMPORAL_TASK_QUEUE,
            )
            logger.info(f"Temporal workflow {workflow_id} initiated.")
        except Exception as e:
            logger.warning(f"Temporal start failed ({e}). Falling back to resilient cloud task.")
            asyncio.create_task(
                _resilient_cloud_steep_pipeline(
                    brew_id, player_id, request.ingredients, duration_seconds, len(arrivals), target
                )
            )
    else:
        asyncio.create_task(
            _resilient_cloud_steep_pipeline(
                    brew_id, player_id, request.ingredients, duration_seconds, len(arrivals), target
                )
        )

    return {"message": "Brew started successfully", "brew": brew_doc}

@app.post("/api/brew/claim")
async def claim_brew(
    player_id: str = Depends(get_player_id),
    brew_id: Optional[str] = Body(None, embed=True)
):
    """
    Claim harvest, deposit loot in user vault, reset vat.
    """
    query = {"player_id": player_id, "status": "ready"}
    if brew_id:
        query["brew_id"] = brew_id

    brew = await brews_collection.find_one(query)
    if not brew:
        in_progress = await brews_collection.find_one({"player_id": player_id, "status": "brewing"})
        if in_progress:
            raise HTTPException(status_code=400, detail="Brew is still steeping! Patience, traveler.")
        raise HTTPException(status_code=404, detail="No ready brew found to claim.")

    loot = brew.get("loot") or {
        "rarity": "Common",
        "item_name": "Mystic Herbal Infusion",
        "review": "A pleasant warmth fills your soul as stars align in the cup."
    }

    await brews_collection.update_one(
        {"_id": brew["_id"]},
        {"$set": {"status": "claimed", "claimed_at": datetime.now(timezone.utc).isoformat()}}
    )

    await users_collection.update_one(
        {"player_id": player_id},
        {"$push": {"inventory": loot}}
    )

    logger.info(f"Session {player_id} claimed loot: {loot.get('item_name')}")
    return {"message": "Loot claimed successfully", "loot": loot}
