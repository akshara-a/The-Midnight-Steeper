# 🍵 The Midnight Steeper (Online Edition)

An interdimensional zero-player idle game built for the "Slow and Steady" theme. Mix esoteric cosmic ingredients, ignite the celestial vat, close your tab, and let the 24-hour Sloth Engine steep your tea while cosmic travelers visit your teahouse at the edge of the universe.

---

## 🌐 Online Architecture (Zero Logins • Pure Local Session)

* **No Login Walls:** Players never encounter a login or password screen.
* **Local Session Persistence:** A unique UUID is stored in browser `localStorage` and a persistent 365-day cookie (`midnight_steeper_session`). Each visitor automatically gets an isolated, durable game state that persists across tab closes, browser restarts, and reloads.
* **Resilient Online Engine:**
  - Works with **Temporal** for resilient distributed workflow timers.
  - Automatically activates an in-process cloud asynchronous scheduler if deployed to a single cloud container without Temporal.
  - Supports both **Local Ollama (`gemma2`)** and **Cloud LLM APIs** (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`) for instant zero-server AI reviews.

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
   * `GEMINI_API_KEY`: (Optional) Free API key for cosmic traveler reviews.
   * `ELEVENLABS_API_KEY`: (Optional) For voice broadcasts.
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

Visit [http://localhost:3000](http://localhost:3000) to begin steeping your cosmic tea.
