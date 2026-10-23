#!/bin/bash
set -e

PORT=${PORT:-3000}
INTERNAL_API_PORT=8000

echo "🍵 Starting The Midnight Steeper Unified Cloud Stack on Render..."

# 1. Start FastAPI backend on internal port 8000
cd /app/backend
python3 -m uvicorn main:app --host 127.0.0.1 --port $INTERNAL_API_PORT &
BACKEND_PID=$!
echo "✓ FastAPI backend listening on 127.0.0.1:$INTERNAL_API_PORT (PID: $BACKEND_PID)"

# 2. Optionally start Temporal Worker if a remote Temporal host is configured
if [ -n "$TEMPORAL_HOST" ] && [ "$TEMPORAL_HOST" != "localhost:7233" ]; then
  echo "✓ Starting Temporal Worker connecting to $TEMPORAL_HOST..."
  python3 temporal_worker.py &
fi

# 3. Start Next.js frontend on public $PORT assigned by Render
cd /app/frontend
export INTERNAL_API_URL="http://127.0.0.1:$INTERNAL_API_PORT"
echo "✓ Next.js frontend starting on public port $PORT..."
exec ./node_modules/.bin/next start -p "$PORT" -H 0.0.0.0
