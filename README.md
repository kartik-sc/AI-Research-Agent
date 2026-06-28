# ResearchOS

An AI-powered multi-agent research workspace. Not a chatbot — a complete research workflow.

**Planner → Parallel Researchers → Verifier → Critic → Writer**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui |
| UI extras | Framer Motion, React Flow, react-markdown |
| Backend | FastAPI, Python 3.12, LangGraph |
| AI | Google Gemini (Planner: Pro, Critic/tools: Flash) |
| Search | Tavily, arXiv, Exa |
| Database | PostgreSQL 16, Redis 7 |
| Orchestration | LangGraph multi-agent graph |

---

## Architecture

```
User
 │
 ├─ Next.js 16 (port 3000)
 │   ├─ Sidebar (session history)
 │   ├─ SearchBar (query + mode selector)
 │   ├─ AgentStream (live SSE feed)
 │   ├─ ReportView (markdown report)
 │   ├─ SourceList (ranked sources)
 │   └─ KnowledgeGraph (React Flow)
 │
 └─ FastAPI (port 8000)
     ├─ POST /api/research      → start session
     ├─ GET  /api/research/stream/{id} → SSE event stream
     ├─ GET  /api/research/{id} → fetch result
     └─ GET/DELETE /api/sessions
         │
         └─ LangGraph Orchestrator
             ├─ Planner agent    (Gemini 1.5 Pro)
             ├─ Researcher agent (Tavily + arXiv + Exa, parallel)
             ├─ Writer agent     (Gemini 1.5 Pro)
             └─ Critic agent     (Gemini 1.5 Flash, skipped in quick mode)
```

### Research Modes

| Mode | Pipeline | Duration |
|------|----------|----------|
| Quick | Researcher → Writer | ~30s |
| Deep | Planner → Researcher (all sources) → Writer → Critic | ~2min |
| Academic | Planner → Researcher (arXiv priority) → Writer → Critic | ~2min |
| Repository | Planner → Researcher → Writer → Critic | ~2min |

---

## Setup

### Prerequisites

- Node.js 22+
- Python 3.12+
- Docker + Docker Compose (for PostgreSQL and Redis)

### 1. Clone and configure

```bash
git clone <repo>
cd AI-Research-Agent

cp .env.example .env
# Edit .env and fill in your API keys:
#   GOOGLE_API_KEY — https://aistudio.google.com
#   TAVILY_API_KEY — https://tavily.com
#   EXA_API_KEY    — https://exa.ai
```

### 2. Start infrastructure

```bash
docker-compose up postgres redis -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google AI Studio key (Gemini) |
| `TAVILY_API_KEY` | Tavily web search API key |
| `EXA_API_KEY` | Exa neural search API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing secret (change before deploying) |

---

## API Reference

### Start research
```
POST /api/research
{ "query": "...", "mode": "deep" | "quick" | "academic" | "repository" }
→ { "session_id": "uuid", "status": "started" }
```

### Stream events (SSE)
```
GET /api/research/stream/{session_id}
→ text/event-stream
  data: { "event_type": "planning"|"searching"|"writing"|"done"|"error", "agent": "...", "message": "..." }
```

### Get result
```
GET /api/research/{session_id}
→ { session_id, query, mode, plan, sources[], report, confidence_score }
```

### Session management
```
GET    /api/sessions          → SessionSummary[]
DELETE /api/sessions/{id}     → 204
```

---

## Project Structure

```
AI-Research-Agent/
├── frontend/                  Next.js 16 app
│   └── src/
│       ├── app/               App Router pages
│       ├── components/
│       │   ├── sidebar/
│       │   ├── search/
│       │   ├── answer/
│       │   ├── sources/
│       │   ├── agent-stream/
│       │   └── knowledge-graph/
│       └── lib/               API helpers + TypeScript types
│
├── backend/                   FastAPI app
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── api/               Route handlers
│       ├── agents/            LangGraph nodes
│       ├── tools/             Search integrations
│       ├── models/            Pydantic schemas + state
│       └── core/              Config + database
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Development Notes

- Sessions are stored in-memory on the backend; restart clears them. PostgreSQL integration is wired up for future persistence via SQLAlchemy.
- The SSE stream polls every 500ms; events are buffered server-side until consumed.
- LangGraph's `Annotated[list, operator.add]` reducer lets multiple agent nodes append to `sources` and `events` without race conditions.
- Critic is skipped in `quick` mode (conditional edge in the graph).
