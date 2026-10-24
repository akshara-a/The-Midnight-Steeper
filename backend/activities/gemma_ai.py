import asyncio
import os
import random
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


def procedural_review(rarity: str, ingredients: list[str], seed: str = "") -> str:
    """Built-in lore writer: no model, no network, always available (e.g. Render free tier)."""
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
        f"You are a kind forest animal friend at Sunny the sloth's tea party. Write exactly 2 short, happy sentences "
        f"for a 6 year old, using very simple words, thanking them for the {rarity} {ingredients_str} tea. "
        f"Be gentle and silly. Nothing scary. End with your animal name, like '- Bunny'."
    )
    review = await asyncio.to_thread(_ollama_review, prompt)
    if review:
        logger.info(f"[Gemma Activity] Completed review generation via Gemma ({os.getenv('OLLAMA_MODEL', 'gemma2')}).")
        return review

    logger.info("[Gemma Activity] Gemma review unavailable. Triggering procedural fallback.")
    fallback = procedural_review(rarity, ingredients, seed)
    logger.info(f"[Gemma Activity] Completed review generation via procedural fallback.")
    return fallback
