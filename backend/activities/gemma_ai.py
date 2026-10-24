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
    rng = random.Random(f"{seed}|{rarity}|{'+'.join(ingredients)}")
    name, title = rng.choice(TRAVELERS)
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    opener = rng.choice(OPENERS.get(rarity, OPENERS["Common"]))
    return f"{opener} The {ingredients_str} blend left me gloriously unhurried. — {name}, {title}"


def _ollama_review(prompt: str) -> str | None:
    host = os.getenv("OLLAMA_HOST", "http://localhost:11434").strip().rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "gemma2").strip()
    if not host:
        return None
    try:
        resp = requests.post(
            f"{host}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=(2, 60),
        )
        if resp.status_code == 200:
            text = resp.json().get("response", "").strip()
            if text:
                logger.info(f"Ollama ({model}) review generated.")
                return text
    except Exception as e:
        logger.info(f"Ollama not reachable ({e}). Using built-in lore writer.")
    return None


@activity.defn
async def generate_review_activity(rarity: str, ingredients: list[str], seed: str = "") -> str:
    """
    Open-weight Gemma via local Ollama (no API key). Falls back to the procedural writer
    when Ollama is unavailable so the game always works.
    """
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    prompt = (
        f"Write a 2-sentence quirky review of {rarity} {ingredients_str} tea as an interdimensional "
        f"cosmic traveler who drank it while the barista was away. End with your alien signature "
        f"(e.g., '— Zorblatt, Voyager of the 9th Sector')."
    )
    review = await asyncio.to_thread(_ollama_review, prompt)
    return review or procedural_review(rarity, ingredients, seed)
