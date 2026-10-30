FROM node:22-bookworm-slim

WORKDIR /app

# Install Python 3, pip, and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Backend Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --break-system-packages -r backend/requirements.txt

# Install Frontend Node dependencies and build Next.js
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY backend ./backend
COPY frontend ./frontend
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh && \
    cd frontend && npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]
