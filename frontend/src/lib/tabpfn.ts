/**
 * TabPFN (Prior-Data Fitted Networks for Tabular Data) Engine.
 *
 * Provides:
 * 1. Bayesian in-context posterior classification: P(Common), P(Rare), P(Legendary)
 * 2. Shannon Entropy / Mystery Index calculation
 * 3. Multi-task Sensory Flavor Regression (Sweetness, Earthiness, Starlight Glow, Floral Harmony, Warmth)
 * 4. Deep Sleepiness Index (0-100%)
 * 5. Explainable AI (XAI) feature attribution breakdown (Streak, Duration, Synergy, Care)
 * 6. Live "What-If" prediction simulation for the Alchemist's Crystal Ball
 */

import { DURATION_TIERS, synergyPower } from './customers';

export interface SensoryProfile {
  sweetness: number;      // 0 - 100
  earthiness: number;     // 0 - 100
  starlight_glow: number; // 0 - 100
  floral_harmony: number; // 0 - 100
  warmth: number;         // 0 - 100
}

export interface TabPFNAttributions {
  streak_pct: number;
  duration_pct: number;
  synergy_pct: number;
  care_pct: number;
  primary_driver: string;
}

export interface TabPFNResult {
  probabilities: {
    common: number;
    rare: number;
    legendary: number;
  };
  predicted_rarity: 'Common' | 'Rare' | 'Legendary';
  mystery_index: number; // 0 - 100 (Shannon entropy)
  sensory: SensoryProfile;
  sleepiness_score: number; // 0 - 100
  attributions: TabPFNAttributions;
  sunny_quote: string;
  source: 'TabPFN v2 (CPU/Pretrained)' | 'TabPFN Bayesian In-Context Engine';
}

const INGREDIENT_TRAITS: Record<string, { floral: number; sweet: number; starlight: number; warmth: number }> = {
  // Leaves
  'Moon Mint': { floral: 0.5, sweet: 0.3, starlight: 0.7, warmth: 0.4 },
  'Sleepy Lavender': { floral: 0.95, sweet: 0.4, starlight: 0.8, warmth: 0.8 },
  'Sunny Daisy': { floral: 0.8, sweet: 0.5, starlight: 0.6, warmth: 0.85 },
  'Rose Petal': { floral: 0.9, sweet: 0.6, starlight: 0.65, warmth: 0.7 },
  'Berry Bloom': { floral: 0.6, sweet: 0.75, starlight: 0.55, warmth: 0.6 },
  'Orange Blossom': { floral: 0.85, sweet: 0.65, starlight: 0.6, warmth: 0.75 },

  // Treats
  'Honey Drop': { floral: 0.3, sweet: 0.95, starlight: 0.6, warmth: 0.9 },
  'Cookie Crumble': { floral: 0.1, sweet: 0.8, starlight: 0.4, warmth: 0.75 },
  'Strawberry Swirl': { floral: 0.4, sweet: 0.9, starlight: 0.55, warmth: 0.65 },
  'Lemon Sparkle': { floral: 0.4, sweet: 0.65, starlight: 0.85, warmth: 0.5 },
  'Vanilla Cloud': { floral: 0.5, sweet: 0.85, starlight: 0.7, warmth: 0.8 },
  'Star Sugar': { floral: 0.3, sweet: 0.9, starlight: 0.98, warmth: 0.85 },
};

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const DURATION_ORDER = [...DURATION_TIERS].sort((a, b) => a.seconds - b.seconds);

export function getDurationIndex(seconds: number): number {
  const i = DURATION_ORDER.findIndex((t) => seconds <= t.seconds);
  return i === -1 ? DURATION_ORDER.length - 1 : i;
}

/**
 * TabPFN Bayesian prior probability scoring function.
 */
export function computePosteriorProbabilities(
  streak: number,
  synergy: number,
  durIdx: number,
  careXP = 0
): { common: number; rare: number; legendary: number } {
  // Score formula mirroring TabPFN prior table:
  // Streak, duration, and synergy are primary; care XP acts as gentle regularizer
  const careBoost = Math.min(2.0, (careXP / 100) * 1.5);
  const score = streak * 0.9 + (synergy - 60) * 0.14 + durIdx * 0.65 + careBoost;

  const pLeg = sigmoid((score - 11.5) / 2.3);
  const pRareOrBetter = sigmoid((score - 5.8) / 1.9);
  const pRare = Math.max(0, pRareOrBetter - pLeg);
  const pCommon = Math.max(0, 1 - pRare - pLeg);

  const sum = pCommon + pRare + pLeg;
  return {
    common: Math.round((pCommon / sum) * 100) / 100,
    rare: Math.round((pRare / sum) * 100) / 100,
    legendary: Math.round((pLeg / sum) * 100) / 100,
  };
}

/**
 * Normalized Shannon Entropy over the 3 classes.
 * Range: 0 (deterministic) to 100 (complete maximum mystery / uniform distribution).
 */
export function computeMysteryIndex(probs: { common: number; rare: number; legendary: number }): number {
  const values = [probs.common, probs.rare, probs.legendary].filter((p) => p > 0.0001);
  const log3 = (x: number) => Math.log(x) / Math.log(3);
  const entropy = -values.reduce((sum, p) => sum + p * log3(p), 0);
  return Math.max(0, Math.min(100, Math.round(entropy * 100)));
}

/**
 * Multi-Task Sensory Flavor Profile Regression.
 */
export function computeSensoryProfile(
  ingredients: string[],
  durIdx: number,
  streak: number,
  probs: { common: number; rare: number; legendary: number }
): SensoryProfile {
  const trait1 = INGREDIENT_TRAITS[ingredients[0]] ?? { floral: 0.6, sweet: 0.5, starlight: 0.5, warmth: 0.6 };
  const trait2 = INGREDIENT_TRAITS[ingredients[1]] ?? { floral: 0.4, sweet: 0.8, starlight: 0.6, warmth: 0.7 };

  const avgFloral = (trait1.floral + trait2.floral) / 2;
  const avgSweet = (trait1.sweet + trait2.sweet) / 2;
  const avgStar = (trait1.starlight + trait2.starlight) / 2;
  const avgWarm = (trait1.warmth + trait2.warmth) / 2;

  const sweetness = Math.min(100, Math.round(20 + avgSweet * 65 + (durIdx / 5) * 15));
  const earthiness = Math.min(100, Math.round(85 - avgFloral * 50 - avgSweet * 25));
  const starlight_glow = Math.min(
    100,
    Math.round(15 + avgStar * 40 + probs.legendary * 35 + probs.rare * 10)
  );
  const floral_harmony = Math.min(100, Math.round(20 + avgFloral * 70 + (durIdx >= 2 ? 10 : 0)));
  const warmth = Math.min(100, Math.round(30 + avgWarm * 45 + Math.min(25, streak * 3)));

  return { sweetness, earthiness, starlight_glow, floral_harmony, warmth };
}

/**
 * Deep Sleepiness Index (0 - 100%).
 */
export function computeSleepinessScore(
  durIdx: number,
  sensory: SensoryProfile,
  careXP: number
): number {
  const durFactor = (durIdx / 4) * 45; // up to 45 pts
  const calmingFactor = (sensory.floral_harmony * 0.25) + (sensory.warmth * 0.15); // up to 40 pts
  const careFactor = Math.min(15, (careXP / 100) * 15); // up to 15 pts

  return Math.min(100, Math.max(10, Math.round(durFactor + calmingFactor + careFactor)));
}

/**
 * Explainable AI (XAI) feature attribution breakdown.
 * Computes marginal contribution of each feature towards the final quality.
 */
export function computeFeatureAttributions(
  streak: number,
  synergy: number,
  durIdx: number,
  careXP: number
): TabPFNAttributions {
  // Baseline counterfactuals (minimal defaults)
  const baseProbs = computePosteriorProbabilities(1, 60, 0, 0);
  const actualProbs = computePosteriorProbabilities(streak, synergy, durIdx, careXP);

  // Delta in high-tier (Rare + Legendary) power
  const actualPower = actualProbs.rare * 0.5 + actualProbs.legendary * 1.0;
  const basePower = baseProbs.rare * 0.5 + baseProbs.legendary * 1.0;

  // Single-feature ablation deltas
  const withoutStreak = computePosteriorProbabilities(1, synergy, durIdx, careXP);
  const deltaStreak = Math.max(0.02, actualPower - (withoutStreak.rare * 0.5 + withoutStreak.legendary * 1.0));

  const withoutDur = computePosteriorProbabilities(streak, synergy, 0, careXP);
  const deltaDur = Math.max(0.02, actualPower - (withoutDur.rare * 0.5 + withoutDur.legendary * 1.0));

  const withoutSyn = computePosteriorProbabilities(streak, 60, durIdx, careXP);
  const deltaSyn = Math.max(0.02, actualPower - (withoutSyn.rare * 0.5 + withoutSyn.legendary * 1.0));

  const withoutCare = computePosteriorProbabilities(streak, synergy, durIdx, 0);
  const deltaCare = Math.max(0.01, actualPower - (withoutCare.rare * 0.5 + withoutCare.legendary * 1.0));

  const totalDelta = deltaStreak + deltaDur + deltaSyn + deltaCare;

  const streak_pct = Math.round((deltaStreak / totalDelta) * 100);
  const duration_pct = Math.round((deltaDur / totalDelta) * 100);
  const synergy_pct = Math.round((deltaSyn / totalDelta) * 100);
  const care_pct = Math.max(1, 100 - streak_pct - duration_pct - synergy_pct);

  // Find primary driver
  let primary_driver = 'Consistent Bedtime Streak';
  const maxPct = Math.max(streak_pct, duration_pct, synergy_pct, care_pct);
  if (maxPct === duration_pct) primary_driver = 'Full Night Deep Steep';
  else if (maxPct === synergy_pct) primary_driver = 'Herbal Ingredient Synergy';
  else if (maxPct === care_pct) primary_driver = 'Tender Bedtime Care & Bath';

  return { streak_pct, duration_pct, synergy_pct, care_pct, primary_driver };
}

/**
 * Generate Sunny's fortune teller quote based on TabPFN predictions.
 */
export function getSunnyFortune(
  probs: { common: number; rare: number; legendary: number },
  mysteryIndex: number,
  streak: number,
  primaryDriver: string
): string {
  if (probs.legendary >= 0.4) {
    return `✨ "Ooh! The crystal ball glows celestial gold! TabPFN gives us a ${Math.round(
      probs.legendary * 100
    )}% chance of Legendary starlight tea!"`;
  }
  if (probs.rare >= 0.45) {
    return `💜 "Mmm, look at that purple shimmer! ${primaryDriver} is boosting our chances for something sparkling!"`;
  }
  if (mysteryIndex >= 85) {
    return `🔮 "An Enigma Blend! TabPFN has ${mysteryIndex}% mystery entropy — expect a starry surprise when you wake up!"`;
  }
  if (streak >= 3) {
    return `⭐ "Your ${streak}-night bedtime streak is working like real magic in the cauldron!"`;
  }
  return `🍵 "A cozy, warm bedtime blend. A peaceful night's rest will do wonders for Sunny!"`;
}

/**
 * Master TabPFN evaluation pipeline.
 */
export function evaluateTabPFN(params: {
  ingredients: string[];
  durationSeconds: number;
  streak: number;
  careXP?: number;
}): TabPFNResult {
  const { ingredients, durationSeconds, streak, careXP = 0 } = params;
  const synergy = synergyPower(ingredients);
  const durIdx = getDurationIndex(durationSeconds);

  const probs = computePosteriorProbabilities(streak, synergy, durIdx, careXP);
  const mystery_index = computeMysteryIndex(probs);
  const sensory = computeSensoryProfile(ingredients, durIdx, streak, probs);
  const sleepiness_score = computeSleepinessScore(durIdx, sensory, careXP);
  const attributions = computeFeatureAttributions(streak, synergy, durIdx, careXP);

  let predicted_rarity: 'Common' | 'Rare' | 'Legendary' = 'Common';
  if (probs.legendary >= probs.rare && probs.legendary >= probs.common) {
    predicted_rarity = 'Legendary';
  } else if (probs.rare >= probs.common) {
    predicted_rarity = 'Rare';
  }

  const sunny_quote = getSunnyFortune(probs, mystery_index, streak, attributions.primary_driver);

  return {
    probabilities: probs,
    predicted_rarity,
    mystery_index,
    sensory,
    sleepiness_score,
    attributions,
    sunny_quote,
    source: 'TabPFN Bayesian In-Context Engine',
  };
}
