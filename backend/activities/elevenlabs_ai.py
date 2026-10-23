import os
import base64
import math
import struct
import io
import wave
import requests
from temporalio import activity

logger = activity.logger

def _generate_fallback_chime_base64() -> str:
    """Generates a pleasant 1.5s cosmic crystal chime sound in base64 WAV format."""
    sample_rate = 22050
    duration = 1.5
    num_samples = int(sample_rate * duration)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_samples):
            t = float(i) / sample_rate
            decay = math.exp(-2.5 * t)
            val = decay * 0.4 * (math.sin(2 * math.pi * 528 * t) + 0.5 * math.sin(2 * math.pi * 1056 * t))
            sample = int(val * 32767.0)
            sample = max(-32768, min(32767, sample))
            frames.extend(struct.pack("<h", sample))
        wav_file.writeframes(frames)
    buffer.seek(0)
    b64_audio = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:audio/wav;base64,{b64_audio}"

def _fetch_free_tts_base64(text: str) -> str | None:
    """
    Text-to-Speech using neural TTS endpoint strictly read from FREE_TTS_ENDPOINT env var.
    Zero fallback links in source code.
    """
    tts_endpoint = os.getenv("FREE_TTS_ENDPOINT", "").strip()
    if not tts_endpoint:
        return None

    try:
        params = {
            "ie": "UTF-8",
            "client": "tw-ob",
            "q": text[:200],
            "tl": "en-us"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(tts_endpoint, params=params, headers=headers, timeout=10)
        if resp.status_code == 200 and len(resp.content) > 100:
            b64_audio = base64.b64encode(resp.content).decode("utf-8")
            return f"data:audio/mp3;base64,{b64_audio}"
    except Exception as e:
        logger.warning(f"Free TTS endpoint error: {e}")
    return None

@activity.defn
async def generate_audio_activity(review_text: str) -> str:
    """
    Takes the Gemma text string as an argument.
    All endpoint URLs and keys are read strictly from environment variables.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    api_endpoint = os.getenv("ELEVENLABS_API_ENDPOINT", "").strip().rstrip("/")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM").strip()

    logger.info(f"Generating audio for review: '{review_text[:40]}...'")

    # 1. ElevenLabs (if key AND endpoint are provided in env)
    if api_key and api_endpoint:
        try:
            url = f"{api_endpoint}/{voice_id}"
            headers = {
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            }
            payload = {
                "text": review_text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=25)
            if resp.status_code == 200:
                b64_audio = base64.b64encode(resp.content).decode("utf-8")
                logger.info("ElevenLabs audio generated successfully.")
                return f"data:audio/mp3;base64,{b64_audio}"
        except Exception as e:
            logger.warning(f"Error calling ElevenLabs: {e}. Falling back to free voice.")

    # 2. Free Neural Speech (if FREE_TTS_ENDPOINT is provided in env)
    free_audio = _fetch_free_tts_base64(review_text)
    if free_audio:
        logger.info("Neural TTS speech generated successfully.")
        return free_audio

    # 3. Procedural Crystal Chime
    logger.info("Using cosmic crystal chime fallback audio.")
    return _generate_fallback_chime_base64()
