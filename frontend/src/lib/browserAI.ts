/**
 * "Sunny's brain": open-weight Gemma 3 (270M, 4-bit) running entirely inside the browser with
 * transformers.js. Free, no API key, no server, and nothing the child sees or types ever leaves the
 * device. A grown-up opts in once; the model is cached by the browser and works offline afterwards.
 */

const MODEL_ID = 'onnx-community/gemma-3-270m-it-ONNX';
const FLAG = 'sunny-brain-enabled';

export type BrainStatus = 'off' | 'loading' | 'ready' | 'error';

interface ProgressEvent {
  status?: string;
  file?: string;
  loaded?: number;
  total?: number;
}

type Generator = (
  messages: { role: string; content: string }[],
  options: Record<string, unknown>
) => Promise<{ generated_text: { role: string; content: string }[] | string }[]>;

let generator: Generator | null = null;
let loading: Promise<void> | null = null;

export const brainWasEnabled = (): boolean => {
  try {
    return localStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
};

export const brainReady = () => generator !== null;

/** Downloads (first time) and loads the model. onProgress receives 0-100. */
export function loadBrain(onProgress: (pct: number) => void): Promise<void> {
  if (generator) return Promise.resolve();
  if (loading) return loading;

  const files = new Map<string, { loaded: number; total: number }>();
  loading = (async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const pipe = await pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
      progress_callback: (e: ProgressEvent) => {
        if (e.status === 'progress' && e.file && e.total) {
          files.set(e.file, { loaded: e.loaded ?? 0, total: e.total });
          let loaded = 0;
          let total = 0;
          files.forEach((f) => {
            loaded += f.loaded;
            total += f.total;
          });
          if (total) onProgress(Math.min(99, Math.round((loaded / total) * 100)));
        }
      },
    });
    generator = pipe as unknown as Generator;
    onProgress(100);
    try {
      localStorage.setItem(FLAG, '1');
    } catch {
      // storage blocked: the model simply will not auto-load next visit
    }
  })().finally(() => {
    loading = null;
  });
  return loading;
}

/** Writes a short, gentle thank-you note from a forest friend. Returns null if nothing usable came back. */
export async function writeNote(friend: string, tea: string, rarityLabel: string): Promise<string | null> {
  if (!generator) return null;
  const prompt =
    `You are ${friend}, a kind forest animal at Sunny the sloth's tea party. ` +
    `Write exactly 2 short, happy sentences for a 6 year old, using very simple words, thanking them for the ${rarityLabel} ${tea}. ` +
    `Be gentle and silly. Nothing scary. End with "- ${friend}".`;
  try {
    const out = await generator([{ role: 'user', content: prompt }], {
      max_new_tokens: 70,
      do_sample: true,
      temperature: 0.8,
      top_p: 0.9,
    });
    const gen = out?.[0]?.generated_text;
    const text = Array.isArray(gen) ? gen[gen.length - 1]?.content : gen;
    const clean = (text ?? '').replace(/\s+/g, ' ').trim();
    return clean.length >= 12 && clean.length <= 320 ? clean : null;
  } catch {
    return null;
  }
}
