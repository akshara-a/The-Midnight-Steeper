/**
 * Keyless AI pipeline for The Midnight Steeper's serverless routes.
 *
 * Reviews: open-weight Gemma via a local/remote Ollama (OLLAMA_HOST). When Ollama is not
 * reachable (e.g. Render's free tier) a built-in lore writer takes over so the game always works.
 * Rarity: the rule-based probability model (the Python backend upgrades this with real TabPFN).
 *
 * Keep the rarity model in sync with backend/activities/tabpfn_ai.py.
 */
import { DURATION_TIERS, rng, synergyPower } from './customers';

const RARITIES = ['Common', 'Rare', 'Legendary'];
const DURATION_ORDER = [...DURATION_TIERS].sort((a, b) => a.seconds - b.seconds);

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function durationIndex(seconds: number): number {
  const i = DURATION_ORDER.findIndex((t) => seconds <= t.seconds);
  return i === -1 ? DURATION_ORDER.length - 1 : i;
}

export function ruleProbabilities(streak: number, synergy: number, durIdx: number): number[] {
  const score = streak + (synergy - 60) / 10 + durIdx * 0.5;
  const pLeg = sigmoid((score - 12) / 2.5);
  const pRare = Math.max(0, sigmoid((score - 6) / 2) - pLeg);
  return [Math.max(0, 1 - pRare - pLeg), pRare, pLeg];
}

/** Samples a rarity from the model's probabilities, seeded so a brew always resolves the same way. */
export function classifyRarity(
  streak: number,
  ingredients: string[],
  durationSeconds: number,
  seed: string
): string {
  const probs = ruleProbabilities(streak, synergyPower(ingredients), durationIndex(durationSeconds));
  const roll = rng(`${seed}|rarity`)();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (roll < acc) return RARITIES[i];
  }
  return RARITIES[RARITIES.length - 1];
}

const TRAVELERS = [
  ['Zorblatt', 'Voyager of the 9th Sector'],
  ['Kael', 'Chronos Monk of the Vega Rift'],
  ['Captain Vex', 'Smuggler of the Orion Rim'],
  ['Astraea', 'Seraph of the Helios Core'],
];

const OPENERS: Record<string, string[]> = {
  Common: [
    'A humble cup, but it warmed my third stomach.',
    'Honest, steady, and gentle on the ion-receptors.',
    'Not a supernova, yet it hummed pleasantly in my antennae.',
  ],
  Rare: [
    'The cup shimmered like a binary star at dusk.',
    'I tasted three dimensions at once and enjoyed all of them.',
    'My hyperdrive sickness vanished halfway down the cup.',
  ],
  Legendary: [
    'Time itself paused to sip this, and so did I.',
    'I have crossed fourteen universal resets and never tasted anything like it.',
    'The cosmos leaned in close to taste this one.',
  ],
};

/** Built-in lore writer: no model, no network. */
export function proceduralReview(rarity: string, ingredients: string[], seed = ''): string {
  console.log(
    `[Gemma Fallback] Activating procedural lore writer (rarity='${rarity}', ingredients=${JSON.stringify(ingredients)}, seed='${seed}').`
  );
  const rand = rng(`${seed}|${rarity}|${ingredients.join('+')}`);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const [name, title] = pick(TRAVELERS);
  const list = ingredients?.length ? ingredients.join(' and ') : 'Nebula Dust and Void Water';
  const opener = pick(OPENERS[rarity] ?? OPENERS.Common);
  const review = `${opener} The ${list} blend left me gloriously unhurried. — ${name}, ${title}`;
  console.log(`[Gemma Fallback] Generated procedural review: "${review}"`);
  return review;
}

export async function generateTravelerReview(
  rarity: string,
  ingredients: string[],
  seed = ''
): Promise<string> {
  console.log(
    `[Gemma AI] Initiating review generation for rarity='${rarity}', ingredients=${JSON.stringify(ingredients)}, seed='${seed}'`
  );
  const list = ingredients?.length ? ingredients.join(' and ') : 'Nebula Dust and Void Water';
  const prompt = `Write a 2-sentence quirky review of ${rarity} ${list} tea as an interdimensional cosmic traveler who drank it while the barista was away. End with your alien signature (e.g., '— Zorblatt, Voyager of the 9th Sector').`;

  const host = (process.env.OLLAMA_HOST ?? 'http://localhost:11434').trim().replace(/\/$/, '');
  const model = (process.env.OLLAMA_MODEL || 'gemma2').trim();

  if (host) {
    try {
      console.log(`[Gemma AI] Querying Ollama at ${host}/api/generate with model '${model}'...`);
      const resp = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: AbortSignal.timeout(20000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = typeof data?.response === 'string' ? data.response.trim() : '';
        if (text) {
          console.log(`[Gemma AI] Ollama (${model}) review generated successfully: "${text}"`);
          return text;
        } else {
          console.warn(`[Gemma AI] Ollama (${model}) returned 200 OK, but response text was empty.`);
        }
      } else {
        console.warn(`[Gemma AI] Ollama (${model}) request failed with status ${resp.status} ${resp.statusText}.`);
      }
    } catch (err) {
      console.warn(`[Gemma AI] Ollama not reachable or encountered error (${err}). Using built-in lore writer.`);
    }
  } else {
    console.warn('[Gemma AI] OLLAMA_HOST is not configured or empty. Using built-in lore writer.');
  }

  console.log('[Gemma AI] Gemma review unavailable. Triggering procedural fallback.');
  const fallback = proceduralReview(rarity, ingredients, seed);
  console.log('[Gemma AI] Completed review generation via procedural fallback.');
  return fallback;
}
