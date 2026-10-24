# 🍵 The Midnight Steeper (Online Edition)

A cozy 3D bedtime tea party for kids aged 5-10, built for the "Slow and Steady" theme. Sunny the sloth is a talking, tappable 3D pet. Kids pick a leaf and a treat, tuck Sunny in for a nap, and Sunny tells them to go to sleep too. The tea steeps in real time while forest-animal friends visit, and in the morning there is a surprise sticker with a kind note from a friend.

**Why it's a good bedtime game:** it ends play instead of extending it. There are no ads, no accounts, no chat and no microphone.

**Open-source and free to run:** Gemma (open-weight) writes the notes, either in the browser (transformers.js, opt-in, ~320 MB once) or through Ollama. TabPFN predicts prize rarity. Sunny's voice is the browser's built-in speech. No API keys anywhere.

---

## 🌐 Online Architecture (Zero Logins • Pure Local Session)

* **No Login Walls:** Players never encounter a login or password screen.
* **Local Session Persistence:** A unique UUID is stored in browser `localStorage` and a persistent 365-day cookie (`midnight_steeper_session`). Each visitor automatically gets an isolated, durable game state that persists across tab closes, browser restarts, and reloads.
* **Resilient Online Engine:**
  - Works with **Temporal** for resilient distributed workflow timers.
  - Automatically activates an in-process cloud asynchronous scheduler if deployed to a single cloud container without Temporal.
  - **No API keys anywhere.** Traveler reviews come from open-weight **Gemma via local Ollama**; if Ollama isn't reachable (e.g. Render's free tier) a built-in lore writer takes over so the game never breaks.
  - Harvest rarity is predicted by open-source **TabPFN** (keyless, CPU) when installed (`pip install -r backend/requirements-ml.txt`), with a transparent rule-based model as the fallback.
  - Traveler voices use the browser's built-in speech synthesis, so there is no TTS service either.

---

## 🚀 How to Deploy Online

### Option A: 1-Click Render Deploy (Frontend + Backend Together)

Deploy both the **Next.js Frontend** and the **FastAPI Backend** together into a **single free Web Service on Render**:

1. Push this repository to GitHub.
2. Go to **[dashboard.render.com](https://dashboard.render.com)**.
3. Click **New +** -> **Blueprint**, and select your repository (it automatically reads [`render.yaml`](./render.yaml)).
   * *Or click **New +** -> **Web Service** -> select your repo -> select **Docker**.*
4. Set your environment variables:
   * `BREW_DURATION_SECONDS`: `15` for testing, `86400` for 24h.
   * No API keys needed. Set `OLLAMA_HOST` only if you host Ollama somewhere reachable.
   *(Database is 100% embedded SQLite - zero external database setup needed!)*
5. Click **Apply / Deploy**! Render will build the unified container and give you a live URL (`https://your-app.onrender.com`).

---

### Option B: Docker Compose (Single Command Online Server)

To deploy on any cloud VPS (Ubuntu, Debian, AWS EC2, DigitalOcean):

```bash
docker compose up -d --build
```
This boots the FastAPI backend and Next.js frontend with automated networking.

---

### Option C: Local Running

Run each in a separate terminal:

```bash
temporal server start-dev
```
```bash
ollama run gemma2
```
```bash
cd backend && uvicorn main:app --reload
```
```bash
cd backend && python temporal_worker.py
```
```bash
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to meet Sunny.
