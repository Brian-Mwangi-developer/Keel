# Keel Setup Guide

Complete step-by-step instructions for getting Keel running locally.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, make sure you have:

### Required

- **Docker** — to run DataHub (the metadata platform)
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Verify: `docker --version`

- **Python 3.12+** — for the Keel backend
  - [Install Python](https://www.python.org/downloads/)
  - Verify: `python3 --version`

- **Node.js 18+** — for the Keel frontend
  - [Install Node.js](https://nodejs.org/)
  - Verify: `npm --version`

- **Git** — to clone repositories
  - [Install Git](https://git-scm.com/)
  - Verify: `git --version`

### Optional

- **Qwen API Key** — for the investigation agent
  - Sign up at [Alibaba Cloud Qwen API](https://dashscope.aliyun.com/)
  - The demo works without this (no-op investigation), but recommended for full functionality

- **Slack Workspace** — for notifications
  - Create a Slack bot in your workspace if you want real Slack notifications
  - Not required for the demo

---

## Quick Start (Automated)

The easiest way to get everything running:

### 1. Clone the Frontend

```bash
git clone https://github.com/Brian-Mwangi-developer/Keel.git
cd Keel
```

### 2. Clone the Backend (into parent directory)

```bash
cd ..
git clone https://github.com/Brian-Mwangi-developer/Keel-Backend.git
cd Keel-Backend

# Configure the backend
cp .env.example .env
# Edit .env and add QWEN_API_KEY and other settings
# (see Configuration section below)

cd ../Keel
```

### 3. Run the Startup Script

```bash
./start-keel.sh
```

This will:
1. Start DataHub (Docker) on localhost:8080
2. Start the Keel backend on localhost:8010
3. Start the Keel frontend on localhost:3000

**That's it!** Open http://localhost:3000 in your browser.

### Stopping Everything

Press `Ctrl+C` in the terminal, or:

```bash
docker stop keel-datahub
```

---

## Manual Setup

If you prefer to set up each component separately:

### Step 1: Start DataHub

DataHub is the metadata source. Keel reads lineage, assets, assertions, and ownership from it.

**Docker (Recommended):**

```bash
docker run -d \
  --name keel-datahub \
  -p 8080:8080 \
  -p 9002:9002 \
  -p 9092:9092 \
  -e DATAHUB_PLAY=true \
  acryldata/datahub-gms:head
```

**Wait for startup:**

```bash
# Check health (may take 30-60 seconds)
curl http://localhost:8080/health
```

Once healthy:
- **GMS API:** http://localhost:8080
- **DataHub UI:** http://localhost:9002

**Fresh Start (No Demo Data):**

If you want a blank DataHub instance instead of the demo data:

```bash
docker run -d \
  --name keel-datahub \
  -p 8080:8080 \
  -p 9002:9002 \
  -p 9092:9092 \
  acryldata/datahub-gms:latest
```

### Step 2: Start the Keel Backend

The backend is a FastAPI service that connects to DataHub and runs the investigation agent.

**Clone and Setup:**

```bash
cd ..
git clone https://github.com/Brian-Mwangi-developer/Keel-Backend.git
cd Keel-Backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Configure Environment:**

```bash
cp .env.example .env
# Edit .env (see Configuration section)
nano .env
```

**Start the Server:**

```bash
# Option 1: Using the startup script (recommended)
./start-backend.sh

# Option 2: Manual uvicorn
uvicorn app.main:app --port 8010 --reload
```

The backend will be at http://localhost:8010.

### Step 3: Start the Keel Frontend

The frontend is a Next.js React app.

**Setup (from the Keel/ directory):**

```bash
cd ../Keel
npm install
```

**Create Environment Config:**

```bash
cat > .env.local << EOF
KEEL_BACKEND_URL=http://localhost:8010
EOF
```

**Start the Dev Server:**

```bash
npm run dev
```

The frontend will be at http://localhost:3000.

---

## Configuration

### Frontend Configuration (.env.local)

Location: `Keel/.env.local`

```env
# Backend API URL
KEEL_BACKEND_URL=http://localhost:8010
```

That's it for the frontend. Everything else is configured on the backend.

### Backend Configuration (.env)

Location: `Keel-Backend/.env`

Copy from the example:

```bash
cp .env.example .env
```

Then edit `Keel-Backend/.env`:

#### DataHub

```env
# DataHub GMS (the metadata API)
DATAHUB_GMS_URL=http://localhost:8080

# Auth token (usually empty for local DataHub)
DATAHUB_GMS_TOKEN=

# UI base URL (for links in Slack messages)
DATAHUB_UI_BASE=http://localhost:9002
```

#### Qwen LLM (Required for Full Agent Functionality)

The agent uses Qwen to investigate incidents and draft notifications.

```env
# Get API key from https://dashscope.aliyun.com/
QWEN_API_KEY=sk_...your_key_here...

# Base URL (usually this)
QWEN_BASE_URL=https://api.qwen.com/v1

# Model (use this or compatible)
QWEN_MODEL=qwen3-coder-flash
```

If you don't have a Qwen key, the agent will still run but won't draft messages (graceful degradation).

#### Redis (Pending Approvals)

```env
# Redis for storing pending human approvals
# Make sure Redis is running on localhost:6379 (or adjust URL)
REDIS_URL=redis://localhost:6379/0
```

**Note:** Most local Docker setups include Redis. If you get a connection error, install Redis:

```bash
# macOS
brew install redis
redis-server

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

#### Slack Notifications (Optional)

If you want the agent to send real Slack messages:

```env
# Slack bot token (create a bot in your Slack workspace)
SLACK_BOT_TOKEN=xoxb_...your_token_here...

# Signing secret (for webhook verification)
SLACK_SIGNING_SECRET=...

# Default incident channel (optional)
SLACK_INCIDENT_CHANNEL=

# MCP server settings
TOOLS_IS_MUTATION_ENABLED=false
```

**To create a Slack bot:**

1. Go to [Your Slack Apps](https://api.slack.com/apps)
2. Create a new app → "From scratch"
3. Name it "Keel" and select your workspace
4. Go to **OAuth & Permissions**
5. Add scopes: `chat:write`, `chat:write.public`
6. Install the app to your workspace
7. Copy the **Bot User OAuth Token** and paste into `.env`

Then invite the bot to channels:

```
/invite @keel
```

#### Demo Configuration (Optional)

```env
# Default pipeline to show on dashboard
DEFAULT_PIPELINE_ROOT_URN=urn:li:dataset:(urn:li:dataPlatform:kafka,trust-layer.driver-location-events,PROD)

# Max hops for lineage walks (default: 5)
DEFAULT_MAX_HOPS=5
```

---

## Verification

Once everything is running, verify each component:

### 1. Check DataHub

```bash
curl http://localhost:8080/health
# Should return: {"status": "ok"}
```

Open http://localhost:9002 and look for the demo pipeline.

### 2. Check Backend

```bash
curl http://localhost:8010/health
# Should return: {"status": "ok"}
```

Check backend logs:

```bash
tail -f ../Keel-Backend/backend.log
```

### 3. Check Frontend

Open http://localhost:3000 in your browser. You should see:

- **Dashboard** page with "Pipeline health" and a trust index score
- **Assets** page listing assets from DataHub
- **Incidents** page (empty until you trigger an investigation)

### 4. Run a Demo Investigation

1. Go to **Dashboard**
2. Click **"Inject bad event"** (only if demo data is loaded)
3. Select a scenario (e.g., "demand spike")
4. Click **"Test"**
5. Watch the score change and an incident appear in **Incidents**

---

## Troubleshooting

### "Connection refused: localhost:8080"

**DataHub isn't running.**

```bash
# Start DataHub
docker run -d \
  --name keel-datahub \
  -p 8080:8080 \
  -p 9002:9002 \
  -p 9092:9092 \
  -e DATAHUB_PLAY=true \
  acryldata/datahub-gms:head

# Wait for it to be ready
sleep 30
curl http://localhost:8080/health
```

### "FileNotFoundError: mcp-server-datahub"

**The MCP binary isn't on PATH.**

```bash
cd Keel-Backend
source .venv/bin/activate
pip install mcp-server-datahub
```

The backend resolves it from your venv automatically.

### "pip install failed"

**Dependency conflict or missing system libraries.**

```bash
# Create a fresh venv
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Try install again
pip install -r requirements.txt
```

If it still fails, check if you're on Python 3.12+:

```bash
python3 --version
```

### "Frontend won't connect to backend"

**Check .env.local:**

```bash
cat .env.local
# Should show: KEEL_BACKEND_URL=http://localhost:8010
```

Or check browser console (F12) for network errors.

### "QWEN_API_KEY not set"

**The investigation agent needs a Qwen key for full functionality.**

Get one from [dashscope.aliyun.com](https://dashscope.aliyun.com/), then edit `.env`:

```env
QWEN_API_KEY=sk_your_key_here
```

Restart the backend. The agent will work without this (but won't draft messages).

### "Redis connection refused"

**Redis isn't running. Start it:**

```bash
# Docker (easiest)
docker run -d -p 6379:6379 redis:latest

# Or macOS
brew install redis
redis-server

# Or Linux
sudo apt-get install redis-server
redis-server
```

### "Port already in use"

**Another process is using the port.**

```bash
# Find what's using port 8010 (backend)
lsof -i :8010

# Kill it (replace PID with the actual PID)
kill -9 <PID>

# Or use a different port
BACKEND_PORT=8011 ./start-backend.sh
```

---

## Next Steps

Once everything is running:

1. **Explore the Dashboard** — See the live trust index
2. **Read IDEA.md** — Understand the trust model
3. **Read HACKATHON.md** — Follow the 7-step demo walkthrough
4. **Configure Slack** — Set up department channels and notifications
5. **Upload Real Data** — Connect to your own DataHub instance

---

## Getting Help

- **Backend logs:** `tail -f ../Keel-Backend/backend.log`
- **Frontend logs:** Check browser console (F12)
- **DataHub logs:** `docker logs keel-datahub`
- **GitHub:** [Brian-Mwangi-developer/Keel](https://github.com/Brian-Mwangi-developer/Keel)
- **DataHub Docs:** [datahub.io](https://datahub.io/)

---

**Ready to go?** Open http://localhost:3000 and start exploring! 🚀
