/**
 * Sunny's voice: the browser's built-in speech synthesis. Free, offline-capable on most devices,
 * and no microphone or network service is involved.
 */

const PREFERRED = ['Samantha', 'Google UK English Female', 'Zira', 'Aria', 'Jenny', 'Karen', 'Moira'];

// Strips emoji so the voice does not read their names aloud
const EMOJI = /[\p{Extended_Pictographic}‍️]/gu;

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  cachedVoice =
    english.find((v) => PREFERRED.some((p) => v.name.includes(p))) ?? english[0] ?? voices[0] ?? null;
  return cachedVoice;
}

export const speech = {
  enabled: true,

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  /** Speak in a cartoon-high voice. onStart/onEnd drive Sunny's mouth animation. */
  speak(text: string, handlers?: { onStart?: () => void; onEnd?: () => void }) {
    if (!this.enabled || !this.supported) {
      handlers?.onEnd?.();
      return;
    }
    const clean = text.replace(EMOJI, '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(clean);
    const voice = pickVoice();
    if (voice) utt.voice = voice;
    utt.pitch = 1.7;
    utt.rate = 1.0;
    utt.onstart = () => handlers?.onStart?.();
    utt.onend = () => handlers?.onEnd?.();
    utt.onerror = () => handlers?.onEnd?.();
    window.speechSynthesis.speak(utt);
  },

  stop() {
    if (this.supported) window.speechSynthesis.cancel();
  },
};
