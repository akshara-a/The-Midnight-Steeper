import asyncio
import math
import os
import random
from temporalio import activity
from database import users_collection, brews_collection
from customers import DURATION_TIERS, synergy_power

logger = activity.logger

RARITIES = ["Common", "Rare", "Legendary"]
_DURATION_ORDER = [k for k, _ in sorted(DURATION_TIERS.items(), key=lambda kv: kv[1][0])]


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def duration_index(duration_seconds: int) -> int:
    for i, key in enumerate(_DURATION_ORDER):
        if duration_seconds <= DURATION_TIERS[key][0]:
            return i
    return len(_DURATION_ORDER) - 1


def rule_probabilities(streak: int, synergy: int, dur_idx: int) -> list[float]:
    """Transparent fallback model: a longer streak, better synergy and longer steep raise the odds."""
    score = streak + (synergy - 60) / 10 + dur_idx * 0.5
    p_leg = _sigmoid((score - 12) / 2.5)
    p_rare_or_better = _sigmoid((score - 6) / 2)
    p_rare = max(0.0, p_rare_or_better - p_leg)
    return [max(0.0, 1 - p_rare - p_leg), p_rare, p_leg]


def _prior_table() -> tuple[list[list[float]], list[int]]:
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


def _tabpfn_probabilities(X_train, y_train, x_now) -> list[float] | None:
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


async def _player_history(player_id: str) -> tuple[list[list[float]], list[int]]:
    X, y = [], []
    try:
        brews = await brews_collection.find({"player_id": player_id})
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


@activity.defn
async def determine_rarity_activity(
    player_id: str,
    ingredients: list[str] | None = None,
    duration_seconds: int = 0,
    seed: str = "",
) -> str:
    """
    Classify the harvest rarity. Uses open-source TabPFN (no API key, runs locally on CPU)
    over a prior table plus the player's own brew history when it is installed, and falls
    back to a transparent rule model otherwise. The rarity is sampled from the predicted
    probabilities with a seed so workflow replays stay deterministic.
    """
    streak = 1
    try:
        user = await users_collection.find_one({"player_id": player_id})
        if user:
            streak = user.get("consistency_score", 1)
    except Exception as e:
        logger.warning(f"Error fetching consistency_score: {e}. Defaulting to 1.")

    synergy = synergy_power(ingredients or [])
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
    logger.info(f"{source} probs {[round(p, 2) for p in probs]} -> {rarity} (streak {streak})")
    return rarity
