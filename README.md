# Keel — A Trust Layer for Data Pipelines

**Keel** is a DataHub-native trust layer that computes live 0–100 trust scores for every asset in your data pipeline. A score is inherited from everything it's built on — when upstream data breaks, downstream dashboards automatically show a warning before anyone acts on the bad number.

## What is Keel?

Keel answers a question every data-driven company asks and nobody can actually answer: **"Can I trust this number, right now?"**

It computes trust by walking your real lineage graph (via DataHub), inspecting schema stability, freshness, ownership, and quality assertions, and propagating that confidence downstream. An upstream breaking a critical check isn't just a red dot on a table — it's a warning on every dashboard built from it, in real time.

**Key insight:** Trust is inherited, not measured in isolation.

```
trust = min( own_health × validity_gate,  min(upstream_trust) + hop_recovery )
```

See the project documentation for the full product philosophy and demo walkthrough.

## Getting Started

Keel is a **frontend + backend** system. You'll need:

1. **DataHub** (local or cloud) — the metadata graph Keel reads from and writes to
2. **Keel Backend** — FastAPI Python service, connects to DataHub + Qwen LLM, serves `/agent` routes
3. **Keel Frontend** — Next.js React app, runs on localhost:3000

### Prerequisites

- **Docker** (for DataHub)
- **Python 3.12+** (for backend)
- **Node.js 18+** (for frontend)
- **Qwen API credentials** (for the investigation agent; optional for demo mode)

### Quick Start (One Command)

We provide a startup script that handles all three pieces:

```bash
./start-keel.sh
```

This will:
1. Start DataHub on localhost:8080 (Docker)
2. Start the Keel backend on localhost:8010
3. Start the Next.js frontend on localhost:3000

Then open **http://localhost:3000** in your browser.

### Manual Setup

If you prefer to set up each component separately:

#### 1. Start DataHub

DataHub is the metadata source. Keel reads lineage, assets, assertions, schema history, and ownership from it.

**Docker:**
```bash
docker run \
  --name datahub \
  -p 8080:8080 \
  -p 9002:9002 \
  -p 9092:9092 \
  -e DATAHUB_PLAY=true \
  acryldata/datahub-gms:head
```

Keel expects DataHub to be at `http://localhost:8080`. Once started, the DataHub UI is at **http://localhost:9002**.

**Note:** This includes a demo instance with sample data. For a fresh start, omit the `DATAHUB_PLAY=true` env var and use `acryldata/datahub-gms:latest` instead.

#### 2. Start the Keel Backend

The backend is a separate FastAPI service. Clone and run it:

```bash
git clone https://github.com/Brian-Mwangi-developer/Keel-Backend.git
cd Keel-Backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings (see "Configuration" below)

# Start the server
uvicorn app.main:app --port 8010
```

The backend will be available at **http://localhost:8010**.

#### 3. Start the Keel Frontend

From this directory:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

## Configuration

### Frontend (.env.local)

Create `.env.local` in the frontend root:

```env
KEEL_BACKEND_URL=http://localhost:8010
```

(This is already set if you use `start-keel.sh`.)

### Backend (.env)

The backend needs configuration for DataHub and the Qwen LLM. Create `.env` in the `Keel-Backend` directory:

```env
# DataHub
DATAHUB_GMS_URL=http://localhost:8080
DATAHUB_GMS_TOKEN=

# Qwen (LLM for the investigation agent)
QWEN_API_KEY=your_qwen_api_key
QWEN_BASE_URL=https://api.qwen.com/v1
QWEN_MODEL=qwen3-coder-flash

# Redis (for pending approvals)
REDIS_URL=redis://localhost:6379/0

# Slack (optional, for notifications)
SLACK_BOT_TOKEN=
SLACK_INCIDENT_CHANNEL=

# Demo pipeline root (optional)
DEFAULT_PIPELINE_ROOT_URN=urn:li:dataset:(urn:li:dataPlatform:kafka,trust-layer.driver-location-events,PROD)
```

**Qwen API Key:** Get one from [Alibaba Cloud's Qwen API](https://dashscope.aliyun.com/). Qwen is used for the agent's investigation phase (grounded in DataHub's MCP server, but drafted via LLM).

**Slack (Optional):** For notifications to land in Slack channels, set `SLACK_BOT_TOKEN` and create a Slack bot in your workspace. Then configure department channels in the Keel UI at **Settings > Notification routing**.

## Features

### Dashboard / Pipeline Health

See a live 0–100 trust index for your entire pipeline, broken down by:
- **Pipeline Trust Index** — one score for the whole pipeline
- **Assets at Risk** — how many assets are below 80 (use with care)
- **Failing Today** — assets below 50 (don't trust today)
- **Movers** — assets whose score changed most since last check

Click any asset to see:
- **Breakdown** — what went wrong (own health vs. upstream caps)
- **Lineage** — visual graph of dependencies
- **Rules** — which quality checks are passing/failing

### Incident Investigation & Approval

When something breaks:

1. **Investigate** — Click "Inject bad event" (demo) or trigger via the API. The agent investigates using DataHub's MCP server, pulls incident memory, and recommends actions.
2. **Approve** — Review the agent's recommendation. Approve to send notifications to owners and teams.
3. **Mark Fixed** — Once the underlying data is fixed, click "Mark fixed" to un-flag the asset and re-pass assertions in DataHub.

### Governance

- **Flag unsafe** — Mark an asset "don't use this yet" (writes to DataHub's deprecation aspect)
- **Notify owners** — Send real Slack messages to the team that owns an asset
- **Notify departments** — Route notifications to Finance, Engineering, Marketing, etc. via department Slack channels (configurable at **Settings > Notification routing**)
- **Assign owner** — Add an owner to an unowned asset
- **Create rules** — Define quality assertions (e.g., "demand_index must be in [0, 1]")

### Demo Mode

The included demo data (with `start-keel.sh`) includes:

- **5 assets** in a mock ride-hailing pipeline (Kafka source → Snowflake → Looker dashboard)
- **3 inject scenarios** — "demand spike," "supply collapse," "surge ceiling" — to trigger realistic failures
- **Department routing** — pre-configured Slack channels for Engineering, Marketing, Sales, Finance

Use **"Inject bad event"** on the Dashboard to simulate a real break and watch the score cascade.

## Project Structure

```
keel/                           # Frontend (Next.js)
├── src/
│   ├── app/                     # App Router pages
│   ├── components/              # React components
│   ├── lib/keel/                # Keel client + actions
│   └── ...
├── .env.local                   # Frontend config
└── README.md                    # This file

Keel-Backend/                   # Backend (FastAPI, cloned separately)
├── app/
│   ├── agent/                   # LLM investigation + MCP tools
│   ├── api/                     # Routes + schemas
│   ├── datahub/                 # DataHub I/O (lineage, mutations, etc.)
│   ├── trust/                   # Trust model (pure Python port from JS)
│   └── ...
├── .env                         # Backend config
└── README.md
```

## Live Demo Walkthrough

The demo script walks through:

1. A healthy pipeline, all green
2. Inject a bad event (trigger a quality check failure)
3. Watch the score cascade downstream in real time
4. Open an asset and see the breakdown (what failed, why it matters)
5. Let the agent investigate (calls DataHub MCP, pulls incident memory)
6. Approve notifications (send Slack alerts to the owning team)
7. Mark fixed (un-flag + re-pass the assertion, watch trust recover)

## Troubleshooting

### Backend won't start

**"FileNotFoundError: mcp-server-datahub"** — The MCP server binary isn't on PATH.

```bash
cd Keel-Backend
source .venv/bin/activate
# The binary is inside .venv/bin/; the backend resolves it automatically.
# If this error persists, reinstall: pip install mcp-server-datahub
```

### DataHub connection refused

**"Connection refused at http://localhost:8080"** — DataHub isn't running. Start it:

```bash
docker run -p 8080:8080 -p 9002:9002 -p 9092:9092 -e DATAHUB_PLAY=true acryldata/datahub-gms:head
```

### Scores not updating after fixing an asset

**"I marked fixed, but the score still shows red"** — The trust engine runs on every fetch. If the score didn't change, the assertion either:
- Wasn't actually re-passed (check backend logs for `assertions_repassed: []`)
- Doesn't exist on that asset (verify in DataHub UI)

Try clicking **"Mark fixed"** again and check the incident's detail page for what was actually cleared.

### Agent investigation is slow or times out

The investigation agent spawns DataHub's MCP server as a subprocess, which takes ~2–3 seconds to initialize on first call. Subsequent calls are faster. If timeouts persist:

- Confirm DataHub is responsive: `curl http://localhost:8080/health`
- Check backend logs for MCP spawn errors
- Increase the backend's `max_iterations` budget (in `app/agent/llm_agent.py`) if the agent is hitting the iteration limit

### Notifications not sending to Slack

**"Tried to notify team 'Finance' in Slack but it failed: not_in_channel"** — The Slack bot hasn't been added to the channel.

1. In Slack, find the channel (e.g., #finance)
2. Add the bot user: `/invite @keel-bot`
3. Retry the notification

## Contributing

This is a hackathon project, built to demonstrate the trust layer concept. Feedback, issues, and PRs are welcome.

## License

Keel is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Learn More

- **DataHub Docs** — [datahub.io](https://datahub.io/) — The metadata platform Keel is built on
- **Qwen LLM** — [dashscope.aliyun.com](https://dashscope.aliyun.com/) — Get API credentials for the investigation agent

---

**Built for the DataHub Hackathon 2024.** Keel is a trust layer for data pipelines: scores every asset against everything it's built on, catches a broken number before anyone acts on it, and uses DataHub's own metadata graph — and DataHub's own MCP server — to do it.
