/**
 * Serverless AI Pipeline for The Midnight Steeper.
 * All third-party endpoints and API keys are strictly read from environment variables only.
 * Zero hardcoded fallback URLs in source code.
 */

export function classifyRarity(consistencyScore: number): string {
  if (consistencyScore >= 8) return 'Legendary';
  if (consistencyScore >= 4) return 'Rare';
  return 'Common';
}

export async function generateTravelerReview(
  rarity: string,
  ingredients: string[]
): Promise<string> {
  const ingredientsStr = ingredients?.length ? ingredients.join(' and ') : 'Nebula Dust and Void Water';
  const prompt = `Write a 2-sentence quirky review of ${rarity} ${ingredientsStr} tea as an interdimensional cosmic traveler who drank it while the barista was away. End with your alien signature (e.g., '— Zorblatt, Voyager of the 9th Sector').`;

  // 1. Google Gemini Cloud API (Strictly from env)
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiEndpoint = process.env.GEMINI_API_ENDPOINT?.trim();

  if (geminiKey && geminiEndpoint) {
    try {
      const url = `${geminiEndpoint}?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini review generation failed:', e);
    }
  }

  // 2. OpenAI / Groq / OpenRouter API (Strictly from env)
  const openaiKey = (process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '').trim();
  const openaiBase = (process.env.OPENAI_BASE_URL || '').trim().replace(/\/$/, '');
  const modelName = process.env.ONLINE_LLM_MODEL || 'gpt-4o-mini';

  if (openaiKey && openaiBase) {
    try {
      const resp = await fetch(`${openaiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You are a quirky cosmic traveler visiting a tea shop at the edge of the universe.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 120,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (e) {
      console.warn('OpenAI review generation failed:', e);
    }
  }

  // 3. Fallback Lore Persona
  return `The ${ingredientsStr} was a bit prickly on my ion-receptors, but this ${rarity} batch instantly cured my hyperdrive sickness! Pure celestial wizardry. — Zorblatt, Voyager of the 9th Sector`;
}

export async function generateSpeechAudio(reviewText: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const apiEndpoint = (process.env.ELEVENLABS_API_ENDPOINT || '').trim().replace(/\/$/, '');
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  const freeTtsEndpoint = (process.env.FREE_TTS_ENDPOINT || '').trim();

  // 1. ElevenLabs (if key AND endpoint provided in env)
  if (apiKey && apiEndpoint) {
    try {
      const url = `${apiEndpoint}/${voiceId}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: reviewText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        return `data:audio/mp3;base64,${b64}`;
      }
    } catch (e) {
      console.warn('ElevenLabs speech generation error:', e);
    }
  }

  // 2. Free Neural Speech (if FREE_TTS_ENDPOINT provided in env)
  if (freeTtsEndpoint) {
    try {
      const freeUrl = `${freeTtsEndpoint}?ie=UTF-8&client=tw-ob&tl=en-us&q=${encodeURIComponent(
        reviewText.slice(0, 200)
      )}`;
      const resp = await fetch(freeUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        if (buffer.byteLength > 100) {
          const b64 = Buffer.from(buffer).toString('base64');
          return `data:audio/mp3;base64,${b64}`;
        }
      }
    } catch (e) {
      console.warn('Free TTS fallback error:', e);
    }
  }

  // 3. Fallback synthetic crystal chime WAV base64
  return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV4GAACBhYqFbXF7ioqWkZqaoJ2ioqKgo6WnpKeoqKmpqqmrqaqprKmrqqqrqaupq6mqqaqpqqmqqamppaSkpKOfnZ2cm5mYmJaUk5OSkZGQkI+Pj46Ojo2NjIyMi4uLiomJh4eHhoWFhYSEg4ODg4GBgYGAgICAf4CAf39/f35+';
}
