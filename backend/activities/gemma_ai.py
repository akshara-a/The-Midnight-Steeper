import os
import random
import logging
from typing import List
import requests
from temporalio import activity

logger = activity.logger

FRIENDS = [
    ("Bunny", "from Clover Hill"),
    ("Fox", "from Maple Woods"),
    ("Bear", "from Honey Hollow"),
    ("Owl", "from Moonlight Tree"),
    ("Frog", "from Lily Pond"),
    ("Penguin", "from Snowy Slide"),
]

OPENERS = {
    "Common": [
        "Thank you for the cozy tea!",
        "This tea made my tummy feel warm.",
        "What a yummy cup of tea!",
    ],
    "Rare": [
        "Wow, this tea sparkles like little stars!",
        "This tea made me giggle and wiggle!",
        "I never tasted tea this sparkly before!",
    ],
    "Legendary": [
        "Magic! This tea is the best in the whole forest!",
        "Everybody at the party said WOW!",
        "This tea is so magical it made my ears tingle!",
    ],
}


def _procedural_review(rarity: str, ingredients: List[str], seed: str = "") -> str:
    """Built-in lore writer fallback: no model, no network, instant zero-lag."""
    logger.info(
        f"[Gemma Fallback] Activating procedural lore writer (rarity='{rarity}', ingredients={ingredients}, seed='{seed}')."
    )
    rng = random.Random(f"{seed}|{rarity}|{'+'.join(ingredients)}")
    name, title = rng.choice(FRIENDS)
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    opener = rng.choice(OPENERS.get(rarity, OPENERS["Common"]))
    review = f"{opener} I loved the {ingredients_str} and I feel so sleepy and happy. Goodnight! — {name} {title}"
    logger.info(f"[Gemma Fallback] Generated procedural review: \"{review}\"")
    return review


def _ollama_review(prompt: str) -> str | None:
    raw_host = os.getenv("OLLAMA_HOST", "").strip().rstrip("/")
    is_cloud = bool(os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production")
    host = raw_host or ("http://localhost:11434" if not is_cloud else "")
    model = os.getenv("OLLAMA_MODEL", "gemma2:2b").strip()

    if not host:
        logger.info("[Gemma] OLLAMA_HOST is not configured for cloud tier. Using built-in procedural lore.")
        return None

    logger.info(f"[Gemma] Querying Ollama at {host}/api/generate with model '{model}'...")
    try:
        resp = requests.post(
            f"{host}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=(1.5, 4.0),
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
        logger.warning(f"[Gemma] Ollama not reachable or encountered error ({e}). Seamlessly using procedural lore writer.")
    return None


@activity.defn
async def generate_review_activity(rarity: str, ingredients: List[str], seed: str = "") -> str:
    """
    Open-weight Gemma via local Ollama (no API key). Falls back to the procedural writer
    when Ollama is unavailable so the game always works on free tiers.
    """
    ingredients = ingredients or []
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    prompt = (
        f"You are a kind forest animal friend at Sunny the sloth's tea party. "
        f"Write exactly 2 short, happy sentences for a 6 year old, using very simple words, "
        f"thanking them for the {rarity} {ingredients_str} tea. "
        f"Be gentle and silly. Nothing scary. End with your animal name, like '- Bunny'."
    )

    review = _ollama_review(prompt)
    if review:
        return review

    return _procedural_review(rarity, ingredients, seed)
