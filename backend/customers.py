"""
Customer quota rules for The Midnight Steeper.

Each steep has a fixed customer *target* set by the game (from the steep length and
the ingredient synergy) and a simulated *actual* number of arrivals decided when the
steep starts. Meeting or beating the target keeps the streak-based rarity; falling
short drops it a tier (two tiers if fewer than half the target showed up).

Keep this in sync with frontend/src/lib/customers.ts.
"""
import math
from typing import List, Optional

# key -> (duration seconds, base customer target)
DURATION_TIERS = {
    "quick": (120, 2),
    "1h": (3600, 2),
    "4h": (14400, 3),
    "12h": (43200, 5),
    "24h": (86400, 7),
}

RARITY_ORDER = ["Common", "Rare", "Legendary"]


def synergy_power(ingredients: List[str]) -> int:
    seed = sum(ord(c) for c in "".join(ingredients[:2]))
    return 60 + (seed % 41)


def customer_target(duration_key: Optional[str], ingredients: List[str]) -> int:
    base = DURATION_TIERS.get(duration_key or "", (0, 2))[1]
    return base + (1 if synergy_power(ingredients) >= 85 else 0)


def _rng(seed_text: str):
    """Deterministic mulberry32 PRNG seeded from an FNV-1a hash of the text."""
    h = 2166136261
    for ch in seed_text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    state = h

    def next_float() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = state
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return next_float


def simulate_arrivals(
    brew_id: str,
    duration_seconds: int,
    target: int,
    ingredients: List[str],
    streak: int,
) -> List[int]:
    """Return sorted arrival offsets (seconds after the steep starts)."""
    rand = _rng(brew_id)
    power = synergy_power(ingredients)
    chance = 0.55 + min(streak, 10) * 0.03 + (power - 60) / 41 * 0.15
    chance = max(0.3, min(0.92, chance))
    offsets = []
    for _ in range(target + 3):
        if rand() < chance:
            offsets.append(int(duration_seconds * (0.05 + 0.9 * rand())))
    return sorted(offsets)


def adjust_rarity(rarity: str, actual: int, target: int) -> str:
    if target <= 0 or actual >= target:
        return rarity
    drop = 2 if actual < math.ceil(target / 2) else 1
    idx = RARITY_ORDER.index(rarity) if rarity in RARITY_ORDER else 0
    return RARITY_ORDER[max(0, idx - drop)]


def bonus_xp(actual: int, target: int) -> int:
    if actual < target:
        return 0
    return 100 + 25 * (actual - target)
