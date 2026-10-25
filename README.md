# 🍵 The Midnight Steeper (Online Edition)

A cozy 3D bedtime tea party for kids aged 5-10, built for the Hacktoberfest "Slow and Steady" theme. Sunny the sloth is a talking, tappable 3D pet. Kids care for Sunny (bubble bath, snacks, mini-games), pick herbal tea leaves, and tuck Sunny in for bedtime. The tea steeps in real time while forest-animal friends visit, and in the morning there is a surprise sticker with a kind note from a friend.

**Why it's a good bedtime game:** it ends play instead of extending it. There are no ads, no accounts, no subscriptions, and no tracking.

---

## 💻 Developer & Judge Guide: Local Gemma / Llama & Render Free Tier

### ☁️ Render Free Tier Disclaimer
Render's free tier provides **512 MB RAM**. This is lightweight and perfect for running the unified Next.js + Three.js app and the procedural lore generator, but **cannot run multi-gigabyte LLM weights (Gemma 2B) inside the container itself**.

### ✨ Zero-Crash Architecture
- **Automatic Fallback:** If `OLLAMA_HOST` is unreachable or unconfigured, the app immediately uses the built-in procedural lore writer with **0 ms delay and 0 errors**.
- **No API Keys Required:** You never need to pay OpenAI, Google Cloud, or Anthropic.

### 🚀 How to Connect Real Local Gemma / Llama (Ollama)
If you want to evaluate the game with real open-weight **Gemma** or **Llama**:

#### 1. Running Locally (`npm run dev`):
```bash
# In terminal 1: Start Ollama with Gemma
ollama run gemma2:2b
# (or: ollama run llama3.2:1b)

# In terminal 2: Start frontend
cd frontend
npm run dev
```
The app automatically connects to `http://localhost:11434` and generates live animal letters using your local model!

#### 2. Testing with your Render Deployed App:
If your app is deployed on Render and you want the cloud instance to query your local GPU/CPU:
```bash
# 1. Tunnel your local Ollama port:
ngrok http 11434

# 2. In your Render Dashboard -> Environment Variables:
OLLAMA_HOST=https://your-ngrok-subdomain.ngrok-free.app
OLLAMA_MODEL=gemma2:2b
```
Render will forward letter generation to your local machine!

#### 3. Client-Side "Sunny's Brain" (In-Browser Gemma via Transformers.js):
You can also opt-in to download Gemma 2B client-side via `@huggingface/transformers` in the browser (Settings / For Grownups modal). Note: This requires ~320 MB of device RAM and WebAssembly support. If browser memory is constrained (e.g. mobile Safari), Sunny seamlessly defaults to the built-in procedural notes!

---

## 🌐 Online Architecture (Zero Logins • Pure Local Session)

* **No Login Walls:** Players never encounter a login or password screen.
* **Local Session Persistence:** A unique UUID is stored in browser `localStorage` and a persistent 365-day cookie (`midnight_steeper_session`). Each visitor automatically gets an isolated, durable game state that persists across tab closes, browser restarts, and reloads.
* **Resilient Online Engine:**
  - Works with **Temporal** for resilient distributed workflow timers.
  - Automatically activates an in-process cloud asynchronous scheduler if deployed to a single cloud container without Temporal.
  - Harvest rarity and multi-task sensory flavor profiles are predicted by open-source **TabPFN** (keyless, CPU), with a transparent Bayesian prior model as the fallback.
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
   * `OLLAMA_HOST`: Leave blank to use built-in procedural lore, or provide an ngrok tunnel to your local Ollama.
5. Click **Apply / Deploy**! Render will build the unified container and give you a live URL (`https://your-app.onrender.com`).

---

### Option B: Docker Compose (Single Command Cloud VPS)

To deploy on any cloud VPS (Ubuntu, Debian, AWS EC2, DigitalOcean):

```bash
docker compose up -d --build
```
This boots the FastAPI backend and Next.js frontend with automated networking.

---

### Option C: Local Running

Run each in a separate terminal:

```bash
# Terminal 1: Local Ollama (Gemma)
ollama run gemma2:2b
```
```bash
# Terminal 2: Backend API
cd backend && uvicorn main:app --reload
```
```bash
# Terminal 3: Frontend Web App
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to meet Sunny.
