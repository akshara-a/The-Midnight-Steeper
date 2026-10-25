import asyncio
import math
import os
import random
from typing import Dict, Any, List, Tuple
from temporalio import activity
from database import users_collection, brews_collection
from customers import DURATION_TIERS, synergy_power

logger = activity.logger

RARITIES = ["Common", "Rare", "Legendary"]
_DURATION_ORDER = [k for k, _ in sorted(DURATION_TIERS.items(), key=lambda kv: kv[1][0])]

INGREDIENT_TRAITS: Dict[str, Dict[str, float]] = {
    # Leaves
    "Moon Mint": {"floral": 0.5, "sweet": 0.3, "starlight": 0.7, "warmth": 0.4},
    "Sleepy Lavender": {"floral": 0.95, "sweet": 0.4, "starlight": 0.8, "warmth": 0.8},
    "Sunny Daisy": {"floral": 0.8, "sweet": 0.5, "starlight": 0.6, "warmth": 0.85},
    "Rose Petal": {"floral": 0.9, "sweet": 0.6, "starlight": 0.65, "warmth": 0.7},
    "Berry Bloom": {"floral": 0.6, "sweet": 0.75, "starlight": 0.55, "warmth": 0.6},
    "Orange Blossom": {"floral": 0.85, "sweet": 0.65, "starlight": 0.6, "warmth": 0.75},

    # Treats
    "Honey Drop": {"floral": 0.3, "sweet": 0.95, "starlight": 0.6, "warmth": 0.9},
    "Cookie Crumble": {"floral": 0.1, "sweet": 0.8, "starlight": 0.4, "warmth": 0.75},
    "Strawberry Swirl": {"floral": 0.4, "sweet": 0.9, "starlight": 0.55, "warmth": 0.65},
    "Lemon Sparkle": {"floral": 0.4, "sweet": 0.65, "starlight": 0.85, "warmth": 0.5},
    "Vanilla Cloud": {"floral": 0.5, "sweet": 0.85, "starlight": 0.7, "warmth": 0.8},
    "Star Sugar": {"floral": 0.3, "sweet": 0.9, "starlight": 0.98, "warmth": 0.85},
}


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def duration_index(duration_seconds: int) -> int:
    for i, key in enumerate(_DURATION_ORDER):
        if duration_seconds <= DURATION_TIERS[key][0]:
            return i
    return len(_DURATION_ORDER) - 1


def rule_probabilities(streak: int, synergy: int, dur_idx: int, care_xp: int = 0) -> List[float]:
    """Transparent fallback model: longer streak, better synergy, longer steep and care raise the odds."""
    care_boost = min(2.0, (care_xp / 100.0) * 1.5)
    score = streak * 0.9 + (synergy - 60) * 0.14 + dur_idx * 0.65 + care_boost
    p_leg = _sigmoid((score - 11.5) / 2.3)
    p_rare_or_better = _sigmoid((score - 5.8) / 1.9)
    p_rare = max(0.0, p_rare_or_better - p_leg)
    p_common = max(0.0, 1.0 - p_rare - p_leg)
    total = p_common + p_rare + p_leg
    return [round(p_common / total, 3), round(p_rare / total, 3), round(p_leg / total, 3)]


def _prior_table() -> Tuple[List[List[float]], List[int]]:
    """Seed context for TabPFN: simulated brews labelled by sampling the rule model."""
    rng = random.Random(0)
    X, y = [], []
    for streak in range(1, 13):
        for synergy in (60, 70, 80, 90, 100):
            for dur_idx in range(len(_DURATION_ORDER)):
                probs = rule_probabilities(streak, synergy, dur_idx)
                X.append([streak, synergy, dur_idx])
                y.append(rng.choices(range(3), weights=probs)[0])
    return X, y


def _tabpfn_probabilities(X_train, y_train, x_now) -> List[float] | None:
    """Keyless TabPFN inference (pretrained weights, CPU). Returns None if unavailable."""
    if os.getenv("ENABLE_TABPFN", "1") == "0":
        return None
    try:
        from tabpfn import TabPFNClassifier
    except ImportError:
        logger.info("TabPFN not installed; using rule-based probabilities.")
        return None
    try:
        clf = TabPFNClassifier(device="cpu", n_estimators=4)
        clf.fit(X_train, y_train)
        proba = clf.predict_proba([x_now])[0]
        out = [0.0, 0.0, 0.0]
        for cls, p in zip(clf.classes_, proba):
            out[int(cls)] = float(p)
        return out
    except Exception as e:
        logger.warning(f"TabPFN inference failed ({e}); using rule-based probabilities.")
        return None


async def _player_history(player_id: str) -> Tuple[List[List[float]], List[int]]:
    X, y = [], []
    try:
        brews = await brews_collection.find({"player_id": player_id}).to_list(100)
        for b in brews:
            loot = b.get("loot") or {}
            base = loot.get("base_rarity") or loot.get("rarity")
            if base in RARITIES and b.get("streak") is not None:
                X.append([
                    b["streak"],
                    synergy_power(b.get("ingredients", [])),
                    duration_index(b.get("duration_seconds", 0)),
                ])
                y.append(RARITIES.index(base))
    except Exception as e:
        logger.warning(f"Could not load brew history: {e}")
    return X, y


def compute_mystery_index(probs: List[float]) -> int:
    """Normalized Shannon Entropy over 3 classes (0 to 100)."""
    vals = [p for p in probs if p > 0.0001]
    if not vals:
        return 50
    entropy = -sum(p * (math.log(p) / math.log(3)) for p in vals)
    return max(0, min(100, round(entropy * 100)))


def compute_sensory_profile(
    ingredients: List[str],
    dur_idx: int,
    streak: int,
    probs: List[float]
) -> Dict[str, int]:
    """Multi-task continuous sensory flavor vector regression."""
    t1 = INGREDIENT_TRAITS.get(ingredients[0] if len(ingredients) > 0 else "", {"floral": 0.6, "sweet": 0.5, "starlight": 0.5, "warmth": 0.6})
    t2 = INGREDIENT_TRAITS.get(ingredients[1] if len(ingredients) > 1 else "", {"floral": 0.4, "sweet": 0.8, "starlight": 0.6, "warmth": 0.7})

    avg_floral = (t1["floral"] + t2["floral"]) / 2
    avg_sweet = (t1["sweet"] + t2["sweet"]) / 2
    avg_star = (t1["starlight"] + t2["starlight"]) / 2
    avg_warm = (t1["warmth"] + t2["warmth"]) / 2

    p_com, p_rare, p_leg = probs[0], probs[1], probs[2]

    sweetness = min(100, round(20 + avg_sweet * 65 + (dur_idx / 5.0) * 15))
    earthiness = min(100, round(85 - avg_floral * 50 - avg_sweet * 25))
    starlight_glow = min(100, round(15 + avg_star * 40 + p_leg * 35 + p_rare * 10))
    floral_harmony = min(100, round(20 + avg_floral * 70 + (10 if dur_idx >= 2 else 0)))
    warmth = min(100, round(30 + avg_warm * 45 + min(25, streak * 3)))

    return {
        "sweetness": sweetness,
        "earthiness": earthiness,
        "starlight_glow": starlight_glow,
        "floral_harmony": floral_harmony,
        "warmth": warmth
    }


def compute_sleepiness_score(dur_idx: int, sensory: Dict[str, int], care_xp: int = 0) -> int:
    dur_factor = (dur_idx / 4.0) * 45
    calming_factor = (sensory.get("floral_harmony", 50) * 0.25) + (sensory.get("warmth", 50) * 0.15)
    care_factor = min(15, (care_xp / 100.0) * 15)
    return min(100, max(10, round(dur_factor + calming_factor + care_factor)))


def compute_feature_attributions(streak: int, synergy: int, dur_idx: int, care_xp: int = 0) -> Dict[str, Any]:
    actual_probs = rule_probabilities(streak, synergy, dur_idx, care_xp)
    actual_power = actual_probs[1] * 0.5 + actual_probs[2] * 1.0

    w_streak = rule_probabilities(1, synergy, dur_idx, care_xp)
    delta_streak = max(0.02, actual_power - (w_streak[1] * 0.5 + w_streak[2] * 1.0))

    w_dur = rule_probabilities(streak, synergy, 0, care_xp)
    delta_dur = max(0.02, actual_power - (w_dur[1] * 0.5 + w_dur[2] * 1.0))

    w_syn = rule_probabilities(streak, 60, dur_idx, care_xp)
    delta_syn = max(0.02, actual_power - (w_syn[1] * 0.5 + w_syn[2] * 1.0))

    w_care = rule_probabilities(streak, synergy, dur_idx, 0)
    delta_care = max(0.01, actual_power - (w_care[1] * 0.5 + w_care[2] * 1.0))

    total = delta_streak + delta_dur + delta_syn + delta_care
    streak_pct = round((delta_streak / total) * 100)
    duration_pct = round((delta_dur / total) * 100)
    synergy_pct = round((delta_syn / total) * 100)
    care_pct = max(1, 100 - streak_pct - duration_pct - synergy_pct)

    max_pct = max(streak_pct, duration_pct, synergy_pct, care_pct)
    primary_driver = "Consistent Bedtime Streak"
    if max_pct == duration_pct:
        primary_driver = "Full Night Deep Steep"
    elif max_pct == synergy_pct:
        primary_driver = "Herbal Ingredient Synergy"
    elif max_pct == care_pct:
        primary_driver = "Tender Bedtime Care & Bath"

    return {
        "streak_pct": streak_pct,
        "duration_pct": duration_pct,
        "synergy_pct": synergy_pct,
        "care_pct": care_pct,
        "primary_driver": primary_driver
    }


def get_sunny_fortune(probs: List[float], mystery: int, streak: int, primary_driver: str) -> str:
    if probs[2] >= 0.4:
        return f"✨ \"Ooh! The crystal ball glows celestial gold! TabPFN gives us a {round(probs[2]*100)}% chance of Legendary starlight tea!\""
    if probs[1] >= 0.45:
        return f"💜 \"Mmm, look at that purple shimmer! {primary_driver} is boosting our chances for something sparkling!\""
    if mystery >= 85:
        return f"🔮 \"An Enigma Blend! TabPFN has {mystery}% mystery entropy — expect a starry surprise when you wake up!\""
    if streak >= 3:
        return f"⭐ \"Your {streak}-night bedtime streak is working like real magic in the cauldron!\""
    return "🍵 \"A cozy, warm bedtime blend. A peaceful night's rest will do wonders for Sunny!\""


@activity.defn
async def determine_rarity_activity(
    player_id: str,
    ingredients: List[str] | None = None,
    duration_seconds: int = 0,
    seed: str = "",
) -> Dict[str, Any]:
    """
    Multi-task TabPFN evaluation activity. Returns rarity, probabilities, sensory profile,
    sleepiness score, mystery index, and feature attributions.
    """
    streak = 1
    try:
        user = await users_collection.find_one({"player_id": player_id})
        if user:
            streak = user.get("consistency_score", 1)
    except Exception as e:
        logger.warning(f"Error fetching consistency_score: {e}. Defaulting to 1.")

    ingredients = ingredients or []
    synergy = synergy_power(ingredients)
    dur_idx = duration_index(duration_seconds)
    x_now = [streak, synergy, dur_idx]

    X, y = _prior_table()
    hx, hy = await _player_history(player_id)
    probs = await asyncio.to_thread(_tabpfn_probabilities, X + hx, y + hy, x_now)
    source = "TabPFN"
    if probs is None:
        probs = rule_probabilities(streak, synergy, dur_idx)
        source = "rule model"

    rng = random.Random(f"{seed}|{player_id}")
    rarity = RARITIES[rng.choices(range(3), weights=[p + 1e-9 for p in probs])[0]]
    mystery = compute_mystery_index(probs)
    sensory = compute_sensory_profile(ingredients, dur_idx, streak, probs)
    sleepiness = compute_sleepiness_score(dur_idx, sensory)
    attributions = compute_feature_attributions(streak, synergy, dur_idx)
    quote = get_sunny_fortune(probs, mystery, streak, attributions["primary_driver"])

    logger.info(f"{source} probs {[round(p, 2) for p in probs]} -> {rarity} (streak {streak})")

    return {
        "rarity": rarity,
        "probabilities": {"common": probs[0], "rare": probs[1], "legendary": probs[2]},
        "mystery_index": mystery,
        "sensory": sensory,
        "sleepiness_score": sleepiness,
        "attributions": attributions,
        "sunny_quote": quote
    }
