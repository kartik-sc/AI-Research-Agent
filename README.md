# ResearchOS

A multi-agent AI research workspace. Submit a query and a coordinated pipeline of specialised agents decomposes it, searches across the web, GitHub, arXiv, and HuggingFace in parallel, fact-checks the results, and synthesises a structured Markdown report with source attribution and an interactive knowledge graph.

**Live:** [ai-research-agent-xi-puce.vercel.app](https://ai-research-agent-xi-puce.vercel.app)  
**API:** [ai-research-agent-backend-9w86.onrender.com](https://ai-research-agent-backend-9w86.onrender.com)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand, SWR |
| Backend | FastAPI, Python 3.12, LangGraph, LangChain |
| LLM | Google Gemini 2.5 Pro (planning/synthesis) · Gemini 2.5 Flash (research) |
| Search | Tavily (web) · arXiv · Exa · GitHub API · HuggingFace |
| Database | PostgreSQL via Neon (serverless) + asyncpg |
| Cache | Redis via Upstash (SSE event queue) |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Architecture

### Agent Pipeline

```
User query
    │
    ▼
┌─────────┐
│ Planner │  Gemini 2.5 Pro
│         │  Decomposes query into 3-5 sub-questions
│         │  Detects topic flags (technical? AI model?)
└────┬────┘
     │ fan-out (LangGraph Send)
     ├──────────────────────────┬──────────────────────────┐
     ▼                          ▼                          ▼
┌────────────┐          ┌─────────────┐          ┌────────────────┐
│ Researcher │ ×N       │ GitHub Agent│ (technical│  HF Agent      │
│ (parallel) │          │             │  queries) │  (AI models)   │
│            │          │ Repo search │           │ Model cards    │
│ Tavily     │          │ Code lookup │           │ Dataset search │
│ arXiv      │          └──────┬──────┘           └───────┬────────┘
│ Exa        │                 │                          │
└─────┬──────┘                 │                          │
      └───────────────┬────────┘──────────────────────────┘
                      │ fan-in
                      ▼
              ┌───────────────┐
              │    Critic      │  (deep / academic modes only)
              │                │  Cross-checks facts, scores source trust
              └───────┬────────┘
                      │
                      ▼
              ┌───────────────┐
              │    Writer      │  Gemini 2.5 Pro
              │                │  Markdown report + knowledge graph
              └───────────────┘
```

### Research Modes

| Mode | Agents active | Notes |
|---|---|---|
| `quick` | Researcher only | Skips Critic, fastest (~30s) |
| `deep` | All agents | Full pipeline, default (~2 min) |
| `academic` | All agents | Higher source depth, arXiv priority (~2 min) |

### Request / SSE Flow

```
POST /api/research
  → creates DB session (status: running)
  → launches asyncio.create_task (LangGraph graph)
  → returns { session_id }

GET /api/research/stream/{session_id}   [SSE]
  → polls Redis list every 200ms
  → streams AgentEvent frames to browser
  → emits { type: "complete", report, sources, ... } on finish

Frontend (Zustand store)
  → receives SSE frames → updates agentEvents[]
  → on "complete" → sets response, triggers session list refresh
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech) free tier)
- Redis (local or [Upstash](https://upstash.com) free tier)

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Required
GOOGLE_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key

# Database — any standard postgres:// format is accepted (auto-normalised)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/researchos

# Redis
REDIS_URL=redis://localhost:6379

# Optional
EXA_API_KEY=
GITHUB_TOKEN=
CORS_ORIGINS=http://localhost:3000
```

```bash
uvicorn main:app --reload
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

> **DATABASE_URL normalisation:** The config layer automatically converts `postgres://` or `postgresql://` URLs to the `postgresql+asyncpg://` dialect, and rewrites `sslmode=require` → `ssl=require` (asyncpg parameter convention). You can paste a raw Neon connection string directly.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
# App: http://localhost:3000
```

---

## Database Schema

Run this in the Neon SQL Editor (or any PostgreSQL client) before first boot:

```sql
CREATE TABLE IF NOT EXISTS projects (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    color       VARCHAR(7)   NOT NULL DEFAULT '#7F77DD',
    icon        VARCHAR(50)  NOT NULL DEFAULT 'folder',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id                   VARCHAR(36) PRIMARY KEY,
    query                TEXT        NOT NULL,
    mode                 VARCHAR(20) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'pending',
    report               TEXT,
    sources_json         TEXT,
    sub_questions_json   TEXT,
    knowledge_nodes_json TEXT,
    knowledge_edges_json TEXT,
    follow_ups_json      TEXT,
    agent_events_json    TEXT,
    created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
    completed_at         TIMESTAMP,
    duration_seconds     INTEGER,
    project_id           VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL
);
```

The backend also runs `Base.metadata.create_all` on startup so tables are created automatically on a fresh database. The manual SQL is needed when recreating tables or recovering from schema drift.

---

## API Reference

### Research

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/research` | Start a research session |
| `GET` | `/api/research/stream/{id}` | SSE stream of agent events |
| `GET` | `/api/research/{id}/result` | Fetch completed result (202 if still running) |

**POST /api/research**
```json
{
  "query": "What are the latest advances in diffusion models?",
  "mode": "deep",
  "session_id": null
}
```

**SSE frame types**
```
AgentEvent  { agent_name, event_type: "thinking"|"action"|"complete", message, timestamp }
Complete    { type: "complete", session_id, report, sources[], sub_questions[], knowledge_nodes[], knowledge_edges[] }
Error       { type: "error", message }
```

### Sessions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sessions` | List sessions (`limit`, `offset`, `project_id`, `search`) |
| `GET` | `/api/sessions/{id}` | Full session detail including report |
| `DELETE` | `/api/sessions/{id}` | Delete session |
| `PATCH` | `/api/sessions/{id}/project` | Assign to project: `{ "project_id": "..." }` |

### Projects

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects` | List projects with session counts |
| `POST` | `/api/projects` | Create: `{ name, description?, color, icon }` |
| `DELETE` | `/api/projects/{id}` | Delete (sessions set to `project_id = null`) |

### Export

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/export/{id}/markdown` | Download report as `.md` |
| `GET` | `/api/export/{id}/pdf` | Download report as PDF (WeasyPrint) |

### Health

```
GET /health  →  { "status": "ok", "app": "ResearchOS", "version": "0.3.0" }
```

---

## Environment Variables

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini API key |
| `TAVILY_API_KEY` | Yes | Tavily web search key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (any standard format) |
| `REDIS_URL` | Yes | Redis connection string |
| `EXA_API_KEY` | No | Exa neural search key |
| `GITHUB_TOKEN` | No | Raises GitHub API rate limit |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins: `https://your-app.vercel.app,http://localhost:3000` |
| `PLANNER_MODEL` | No | Default: `gemini-2.5-pro` |
| `RESEARCHER_MODEL` | No | Default: `gemini-2.5-flash` |
| `SECRET_KEY` | No | JWT signing secret (auth not yet wired to routes) |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL, e.g. `https://ai-research-agent-backend-9w86.onrender.com` |

> `NEXT_PUBLIC_` variables are baked into the client bundle at build time. Updating this in Vercel requires a new deployment to take effect.

---

## Deployment

### Frontend → Vercel

1. Import the repo, set root directory to `frontend`.
2. Add `NEXT_PUBLIC_API_URL` pointing to your Render backend.
3. Deploy — Vercel auto-deploys on every push to `main`.

### Backend → Render

1. Create a **Web Service**, root directory `backend`.
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Health check path: `/health`
5. Add all required environment variables.

> Render free tier containers sleep after 15 minutes of inactivity. The first request after a cold start takes 30–60 seconds as the container boots and the Neon connection pool warms up.

### Database → Neon

1. Create a Neon project + database.
2. Copy the **pooled connection string**.
3. Set it as `DATABASE_URL` in Render — format is normalised automatically.
4. Run the schema SQL above in the Neon SQL Editor.

### Cache → Upstash

1. Create an Upstash Redis database.
2. Copy the `redis://` URL and set it as `REDIS_URL` in Render.

---

## Project Structure

```
researchos/
├── backend/
│   ├── main.py                       FastAPI app, CORS middleware, lifespan
│   ├── requirements.txt
│   └── app/
│       ├── agents/
│       │   ├── graph.py              LangGraph graph (fan-out via Send, fan-in routing)
│       │   ├── planner.py            Query decomposition + topic detection
│       │   ├── researcher.py         Web/arXiv/Exa search per sub-question
│       │   ├── github_agent.py       GitHub repo + code search
│       │   ├── huggingface_agent.py  Model card + dataset search
│       │   ├── critic.py             Fact-checking and trust scoring
│       │   └── writer.py             Report synthesis + knowledge graph generation
│       ├── api/
│       │   ├── research.py           POST /research, GET /stream, GET /result
│       │   ├── sessions.py           Session CRUD + project assignment
│       │   └── export.py             Markdown / PDF export
│       ├── core/
│       │   ├── config.py             pydantic-settings; normalises DB URL dialect + SSL params
│       │   ├── database.py           SQLAlchemy ORM (Project, ResearchSession)
│       │   ├── models.py             ModelRouter (pro/flash routing, retry, fallback)
│       │   ├── redis_client.py       SSE event queue helpers
│       │   ├── cache.py              Search result caching layer
│       │   ├── retry.py              Async retry decorator
│       │   └── topic_detector.py     Classifies query to route specialised agents
│       ├── models/
│       │   ├── schemas.py            Pydantic request/response models
│       │   └── state.py              LangGraph ResearchState TypedDict
│       └── tools/
│           ├── tavily_search.py
│           ├── arxiv_search.py
│           └── exa_search.py
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              Main view: idle → running → complete transitions
        │   ├── history/              Session history page
        │   └── projects/             Collections page
        ├── components/
        │   ├── agent-stream/         Live agent event ticker
        │   ├── answer/               Report renderer, citation badges, follow-ups
        │   ├── knowledge-graph/      D3 / ReactFlow knowledge graph
        │   ├── search/               Hero + compact search bar
        │   ├── sidebar/              Navigation + history panel
        │   └── sources/              Source cards (web, GitHub, HuggingFace)
        └── lib/
            ├── api.ts                Typed API client + SSE stream helper
            ├── store.ts              Zustand store (research state + session management)
            └── types.ts              Shared TypeScript types (mirrors backend schemas)
```

---

## Implementation Notes

**LangGraph fan-out:** The planner uses `Send()` to dispatch each sub-question to a separate `researcher` node invocation in parallel. GitHub and HuggingFace agents are conditionally added to the same fan-out batch based on topic flags. `Annotated[list, operator.add]` reducers on `sources` and `agent_events` in `ResearchState` handle the concurrent writes without race conditions.

**SSE architecture:** The graph runs in a background `asyncio.create_task`. Agent nodes push events to a Redis list via `push_event()`. The SSE endpoint polls that list every 200ms and streams new frames to the browser. This decouples the graph execution lifetime from the HTTP connection lifetime.

**pydantic-settings list field:** `CORS_ORIGINS` is typed as `str` (not `list[str]`). pydantic-settings v2 calls `json.loads()` on complex-typed fields before validators run, which crashes on comma-separated strings. The workaround is keeping the field as `str` and parsing it in `get_cors_origins()`.

**asyncpg SSL params:** Neon (and most managed Postgres providers) generate connection strings using `?sslmode=require` (libpq/psycopg2 convention). asyncpg uses `?ssl=require`. The `_fix_db_url` validator in `config.py` rewrites all `sslmode=` variants at settings load time.

---

## Known Limitations

- **Render cold starts:** Free tier containers sleep after 15 min. Long SSE streams (>5 min) may be cut if the container is reclaimed mid-run.
- **Timeline tab:** Placeholder — not implemented.
- **Authentication:** JWT scaffolding is present (python-jose, passlib installed) but not wired to any routes. All endpoints are currently public.
- **Rate limiting:** No per-IP rate limiting on research endpoints.
