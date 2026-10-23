import os
import requests
from temporalio import activity

logger = activity.logger

@activity.defn
async def generate_review_activity(rarity: str, ingredients: list[str]) -> str:
    """
    Takes rarity and ingredients as arguments.
    All endpoints are strictly supplied via environment variables with zero hardcoded fallback URLs.
    """
    ingredients_str = " and ".join(ingredients) if ingredients else "Nebula Dust and Void Water"
    prompt = (
        f"Write a 2-sentence quirky review of {rarity} {ingredients_str} tea as an interdimensional "
        f"cosmic traveler who drank it while the barista was away. End with your alien signature (e.g., '— Zorblatt, Voyager of the 9th Sector')."
    )

    # 1. Cloud Gemini API (Strictly from env)
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_endpoint = os.getenv("GEMINI_API_ENDPOINT", "").strip()

    if gemini_key and gemini_endpoint:
        try:
            url = f"{gemini_endpoint}?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            resp = requests.post(url, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    logger.info("Online Gemini cloud review generated successfully.")
                    return text
        except Exception as e:
            logger.warning(f"Gemini cloud API error: {e}")

    # 2. Cloud OpenAI / Groq / Compatible API (Strictly from env)
    openai_key = (os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("OPENROUTER_API_KEY") or "").strip()
    openai_base = os.getenv("OPENAI_BASE_URL", "").strip().rstrip("/")
    llm_model = os.getenv("ONLINE_LLM_MODEL", "gpt-4o-mini").strip()

    if openai_key and openai_base:
        try:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": llm_model,
                "messages": [
                    {"role": "system", "content": "You are a quirky cosmic traveler visiting a tea shop at the edge of the universe."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 120
            }
            resp = requests.post(f"{openai_base}/chat/completions", headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                text = resp.json()["choices"][0]["message"]["content"].strip()
                if text:
                    logger.info("Online cloud LLM review generated successfully.")
                    return text
        except Exception as e:
            logger.warning(f"Online cloud LLM error: {e}")

    # 3. Local/Remote Ollama Endpoint (Strictly from env)
    ollama_host = os.getenv("OLLAMA_HOST", "").strip().rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "gemma2").strip()

    if ollama_host:
        try:
            payload = {
                "model": ollama_model,
                "prompt": prompt,
                "stream": False
            }
            response = requests.post(f"{ollama_host}/api/generate", json=payload, timeout=30)
            if response.status_code == 200:
                review = response.json().get("response", "").strip()
                if review:
                    logger.info("Ollama local review generated successfully.")
                    return review
        except Exception as e:
            logger.info(f"Ollama host not reachable ({e}). Proceeding to procedural fallback.")

    # 4. Built-in procedural lore fallback
    return (
        f"The {ingredients_str} was a bit prickly on my ion-receptors, but this {rarity} batch "
        f"instantly cured my hyperdrive sickness! Pure celestial wizardry. — Zorblatt, Voyager of the 9th Sector"
    )
