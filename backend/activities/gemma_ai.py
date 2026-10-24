import asyncio
import os
import random
import requests
from temporalio import activity

logger = activity.logger

TRAVELERS = [
    ("Zorblatt", "Voyager of the 9th Sector"),
    ("Kael", "Chronos Monk of the Vega Rift"),
    ("Captain Vex", "Smuggler of the Orion Rim"),
    ("Astraea", "Seraph of the Helios Core"),
]

OPENERS = {
    "Common": [
        "A humble cup, but it warmed my third stomach.",
        "Honest, steady, and gentle on the ion-receptors.",
        "Not a supernova, yet it hummed pleasantly in my antennae.",
    ],
    "Rare": [
        "The cup shimmered like a binary star at dusk.",
        "I tasted three dimensions at once and enjoyed all of them.",
        "My hyperdrive sickness vanished halfway down the cup.",
    ],
    "Legendary": [
        "Time itself paused to sip this, and so did I.",
        "I have crossed fourteen universal resets and never tasted anything like it.",
        "The cosmos leaned in close to taste this one.",
    ],
}


def procedural_review(rarity: str, ingredients: list[str], seed: str = "") -> str:
    """Built-in lore writer: no model, no network, always available (e.g. Render free tier)."""
    logger.info(
        f"[Gemma Fallback] Activating procedural lore writer (rarity='{rarity}', ingredients={ingredients}, seed='{seed}')."
    )
    rng = random.Random(f"{seed}|{rarity}|{'+'.join(ingredients)}")
    name, title = rng.choice(TRAVELERS)
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    opener = rng.choice(OPENERS.get(rarity, OPENERS["Common"]))
    review = f"{opener} The {ingredients_str} blend left me gloriously unhurried. — {name}, {title}"
    logger.info(f"[Gemma Fallback] Generated procedural review: \"{review}\"")
    return review


def _ollama_review(prompt: str) -> str | None:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434").strip().rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "gemma2").strip()
    if not host:
        logger.warning("[Gemma] OLLAMA_HOST is empty or not configured. Falling back to built-in lore writer.")
        return None
    logger.info(f"[Gemma] Querying Ollama at {host}/api/generate with model '{model}'...")
    try:
        resp = requests.post(
            f"{host}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=(2, 60),
        )
        if resp.status_code == 200:
            text = resp.json().get("response", "").strip()
            if text:
                logger.info(f"[Gemma] Ollama ({model}) review generated successfully: \"{text}\"")
                return text
            else:
                logger.warning(f"[Gemma] Ollama ({model}) returned 200 OK, but response text was empty.")
        else:
            logger.warning(
                f"[Gemma] Ollama ({model}) request failed with HTTP {resp.status_code}: {resp.text[:200]}"
            )
    except Exception as e:
        logger.warning(f"[Gemma] Ollama not reachable or encountered error ({e}). Using built-in lore writer.")
    return None


@activity.defn
async def generate_review_activity(rarity: str, ingredients: list[str], seed: str = "") -> str:
    """
    Open-weight Gemma via local Ollama (no API key). Falls back to the procedural writer
    when Ollama is unavailable so the game always works.
    """
    logger.info(
        f"[Gemma Activity] Initiating review generation for rarity='{rarity}', ingredients={ingredients}, seed='{seed}'"
    )
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    prompt = (
        f"Write a 2-sentence quirky review of {rarity} {ingredients_str} tea as an interdimensional "
        f"cosmic traveler who drank it while the barista was away. End with your alien signature "
        f"(e.g., '— Zorblatt, Voyager of the 9th Sector')."
    )
    review = await asyncio.to_thread(_ollama_review, prompt)
    if review:
        logger.info(f"[Gemma Activity] Completed review generation via Gemma ({os.getenv('OLLAMA_MODEL', 'gemma2')}).")
        return review

    logger.info("[Gemma Activity] Gemma review unavailable. Triggering procedural fallback.")
    fallback = procedural_review(rarity, ingredients, seed)
    logger.info(f"[Gemma Activity] Completed review generation via procedural fallback.")
    return fallback
