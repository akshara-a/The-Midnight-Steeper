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

const FRIENDS = [
  ['Bunny', 'from Clover Hill'],
  ['Fox', 'from Maple Woods'],
  ['Bear', 'from Honey Hollow'],
  ['Owl', 'from Moonlight Tree'],
  ['Frog', 'from Lily Pond'],
  ['Penguin', 'from Snowy Slide'],
];

const OPENERS: Record<string, string[]> = {
  Common: ['Thank you for the cozy tea!', 'This tea made my tummy feel warm.', 'What a yummy cup of tea!'],
  Rare: [
    'Wow, this tea sparkles like little stars!',
    'This tea made me giggle and wiggle!',
    'I never tasted tea this sparkly before!',
  ],
  Legendary: [
    'Magic! This tea is the best in the whole forest!',
    'Everybody at the party said WOW!',
    'This tea is so magical it made my ears tingle!',
  ],
};

/** Built-in lore writer: no model, no network. */
export function proceduralReview(rarity: string, ingredients: string[], seed = ''): string {
  console.log(
    `[Gemma Fallback] Activating procedural lore writer (rarity='${rarity}', ingredients=${JSON.stringify(ingredients)}, seed='${seed}').`
  );
  const rand = rng(`${seed}|${rarity}|${ingredients.join('+')}`);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const [name, title] = pick(FRIENDS);
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
  const prompt = `You are a kind forest animal friend at Sunny the sloth's tea party. Write exactly 2 short, happy sentences for a 6 year old, using very simple words, thanking them for the ${rarity} ${list} tea. Be gentle and silly. Nothing scary. End with your animal name, like '- Bunny'.`;

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
