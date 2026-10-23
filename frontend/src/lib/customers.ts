/**
 * Customer quota rules for The Midnight Steeper.
 *
 * Each steep has a fixed customer *target* set by the game (from the steep length and
 * the ingredient synergy) and a simulated *actual* number of arrivals decided when the
 * steep starts. Meeting or beating the target keeps the streak-based rarity; falling
 * short drops it a tier (two tiers if fewer than half the target showed up).
 *
 * Keep this in sync with backend/customers.py.
 */

export interface DurationTier {
  key: string;
  label: string;
  seconds: number;
  baseTarget: number;
}

export const DURATION_TIERS: DurationTier[] = [
  { key: 'quick', label: 'Quick', seconds: 120, baseTarget: 2 },
  { key: '1h', label: '1 Hour', seconds: 3600, baseTarget: 2 },
  { key: '4h', label: '4 Hours', seconds: 14400, baseTarget: 3 },
  { key: '12h', label: '12 Hours', seconds: 43200, baseTarget: 5 },
  { key: '24h', label: '24 Hours', seconds: 86400, baseTarget: 7 },
];

const RARITY_ORDER = ['Common', 'Rare', 'Legendary'];

export function synergyPower(ingredients: string[]): number {
  const seed = ingredients
    .slice(0, 2)
    .join('')
    .split('')
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return 60 + (seed % 41);
}

export function customerTarget(durationKey: string | undefined, ingredients: string[]): number {
  const base = DURATION_TIERS.find((t) => t.key === durationKey)?.baseTarget ?? 2;
  return base + (synergyPower(ingredients) >= 85 ? 1 : 0);
}

/** Deterministic mulberry32 PRNG seeded from an FNV-1a hash of the text. */
function rng(seedText: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sorted arrival offsets (seconds after the steep starts). */
export function simulateArrivals(
  brewId: string,
  durationSeconds: number,
  target: number,
  ingredients: string[],
  streak: number
): number[] {
  const rand = rng(brewId);
  const power = synergyPower(ingredients);
  const chance = Math.max(0.3, Math.min(0.92, 0.55 + Math.min(streak, 10) * 0.03 + ((power - 60) / 41) * 0.15));
  const offsets: number[] = [];
  for (let i = 0; i < target + 3; i++) {
    if (rand() < chance) offsets.push(Math.floor(durationSeconds * (0.05 + 0.9 * rand())));
  }
  return offsets.sort((a, b) => a - b);
}

export function adjustRarity(rarity: string, actual: number, target: number): string {
  if (target <= 0 || actual >= target) return rarity;
  const drop = actual < Math.ceil(target / 2) ? 2 : 1;
  const idx = Math.max(0, RARITY_ORDER.indexOf(rarity));
  return RARITY_ORDER[Math.max(0, idx - drop)];
}

export function bonusXp(actual: number, target: number): number {
  return actual < target ? 0 : 100 + 25 * (actual - target);
}
